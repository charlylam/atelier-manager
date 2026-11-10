import {
  PhaseStatus,
  Prisma,
  QuoteStatus,
  WorksiteStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../lib/errors.js';
import { retryOnUniqueViolation } from '../lib/retry.js';
import { toDateString } from '../lib/dates.js';
import { DEFAULT_PHASE_NAMES } from '../lib/default-phases.js';
import {
  DETAILS_EDITABLE,
  PROGRESS_EDITABLE,
  STRUCTURE_EDITABLE,
  canTransitionPhase,
  canTransitionWorksite,
} from '../lib/worksite-status.js';
import type {
  CreatePhaseBody,
  CreateWorksiteBody,
  ListWorksitesQuery,
  RequestedWorksiteStatus,
  UpdatePhaseBody,
  UpdateWorksiteBody,
} from '../validators/worksite.validator.js';

type Db = Prisma.TransactionClient;

const REFERENCE_PREFIX = 'CH-';

const STRUCTURE_MESSAGE =
  'Phases can only be changed while the worksite is pending or in production';
const PROGRESS_MESSAGE =
  'Phase progress can only be changed while the worksite is in production';
const DETAILS_MESSAGE = 'A delivered or canceled worksite cannot be modified';

// ---------------------------------------------------------------------------
// Sélections et présentation
// ---------------------------------------------------------------------------

const phaseSelect = {
  id: true,
  position: true,
  name: true,
  status: true,
  estimatedHours: true,
  actualHours: true,
  notes: true,
  assignee: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.PhaseSelect;

const worksiteDetailSelect = {
  id: true,
  reference: true,
  title: true,
  description: true,
  siteAddress: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, code: true, name: true, address: true } },
  quote: { select: { id: true, reference: true } },
  phases: { select: phaseSelect, orderBy: { position: 'asc' } },
} satisfies Prisma.WorksiteSelect;

const worksiteSummarySelect = {
  id: true,
  reference: true,
  title: true,
  status: true,
  dueDate: true,
  createdAt: true,
  client: { select: { id: true, code: true, name: true } },
  phases: { select: { status: true } },
} satisfies Prisma.WorksiteSelect;

type WorksiteDetail = Prisma.WorksiteGetPayload<{
  select: typeof worksiteDetailSelect;
}>;
type WorksiteSummary = Prisma.WorksiteGetPayload<{
  select: typeof worksiteSummarySelect;
}>;

function presentPhase(phase: WorksiteDetail['phases'][number]) {
  return {
    ...phase,
    estimatedHours: phase.estimatedHours.toFixed(2),
    actualHours: phase.actualHours.toFixed(2),
  };
}

function sumHours(
  phases: WorksiteDetail['phases'],
  key: 'estimatedHours' | 'actualHours'
) {
  return phases
    .reduce((total, phase) => total.plus(phase[key]), new Prisma.Decimal(0))
    .toFixed(2);
}

function presentWorksite(worksite: WorksiteDetail) {
  const { phases, dueDate, ...rest } = worksite;
  return {
    ...rest,
    dueDate: toDateString(dueDate),
    phases: phases.map(presentPhase),
    totals: {
      estimatedHours: sumHours(phases, 'estimatedHours'),
      actualHours: sumHours(phases, 'actualHours'),
    },
  };
}

function presentSummary(worksite: WorksiteSummary) {
  const { phases, dueDate, ...rest } = worksite;
  return {
    ...rest,
    dueDate: toDateString(dueDate),
    progress: {
      done: phases.filter((phase) => phase.status === PhaseStatus.done).length,
      total: phases.length,
    },
  };
}

async function getWorksiteDetail(db: Db, workshopId: number, id: number) {
  const worksite = await db.worksite.findFirst({
    where: { id, workshopId },
    select: worksiteDetailSelect,
  });

  if (!worksite) {
    throw new NotFoundError('Worksite not found');
  }

  return presentWorksite(worksite);
}

// ---------------------------------------------------------------------------
// Règles communes
// ---------------------------------------------------------------------------

// Garde des modifications : le chantier doit appartenir à l'atelier et être
// dans l'un des statuts autorisés. L'UPDATE verrouille la ligne du chantier
// jusqu'à la fin de la transaction : deux modifications simultanées, ou une
// modification et un changement de statut, passent l'une après l'autre.
async function lockWorksite(
  db: Db,
  workshopId: number,
  id: number,
  allowedStatuses: WorksiteStatus[],
  conflictMessage: string
) {
  const { count } = await db.worksite.updateMany({
    where: { id, workshopId, status: { in: allowedStatuses } },
    data: { updatedAt: new Date() },
  });

  if (count === 1) {
    return;
  }

  const exists = await db.worksite.findFirst({
    where: { id, workshopId },
    select: { id: true },
  });

  if (!exists) {
    throw new NotFoundError('Worksite not found');
  }
  throw new ConflictError(conflictMessage);
}

async function assertAssigneeInWorkshop(
  db: Db,
  workshopId: number,
  userId: number
) {
  const user = await db.user.findFirst({
    where: { id: userId, workshopId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }
}

// Référence suivante dans l'atelier pour l'année : CH-2026-0001, 0002...
async function nextWorksiteReference(db: Db, workshopId: number, year: number) {
  const prefix = `${REFERENCE_PREFIX}${year}-`;
  const last = await db.worksite.findFirst({
    where: { workshopId, reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const lastNumber = last ? Number(last.reference.slice(prefix.length)) : 0;
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Chantiers
// ---------------------------------------------------------------------------

/**
 * Crée un chantier depuis un devis accepté, sans ressaisie. Si le devis a déjà
 * produit un chantier, celui-ci est renvoyé (created = false) : la demande est
 * idempotente, y compris quand deux demandes arrivent en même temps.
 */
export async function createWorksiteFromQuote(
  workshopId: number,
  input: CreateWorksiteBody
) {
  const year = new Date().getUTCFullYear();

  return retryOnUniqueViolation(
    () =>
      prisma.$transaction(async (tx) => {
        const quote = await tx.quote.findFirst({
          where: { id: input.quoteId, workshopId },
          select: {
            id: true,
            clientId: true,
            title: true,
            description: true,
            status: true,
          },
        });

        if (!quote) {
          throw new NotFoundError('Quote not found');
        }

        if (quote.status !== QuoteStatus.accepted) {
          throw new ConflictError(
            'Only an accepted quote can become a worksite'
          );
        }

        const existing = await tx.worksite.findUnique({
          where: { quoteId: quote.id },
          select: { id: true },
        });

        if (existing) {
          return {
            worksite: await getWorksiteDetail(tx, workshopId, existing.id),
            created: false,
          };
        }

        const reference = await nextWorksiteReference(tx, workshopId, year);
        const worksite = await tx.worksite.create({
          data: {
            workshopId,
            clientId: quote.clientId,
            quoteId: quote.id,
            reference,
            title: quote.title,
            description: quote.description,
            siteAddress: input.siteAddress,
            dueDate: input.dueDate,
            phases: {
              create: DEFAULT_PHASE_NAMES.map((name, index) => ({
                position: index + 1,
                name,
                estimatedHours: 0,
              })),
            },
          },
          select: { id: true },
        });

        return {
          worksite: await getWorksiteDetail(tx, workshopId, worksite.id),
          created: true,
        };
      }),
    'Could not allocate a worksite reference, please retry'
  );
}

export async function searchWorksites(
  workshopId: number,
  query: ListWorksitesQuery
) {
  const { status, clientId, search, page, limit } = query;

  const where: Prisma.WorksiteWhereInput = {
    workshopId,
    ...(status && { status }),
    ...(clientId && { clientId }),
    ...(search && {
      OR: [
        { reference: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [worksites, total] = await prisma.$transaction([
    prisma.worksite.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: worksiteSummarySelect,
    }),
    prisma.worksite.count({ where }),
  ]);

  return {
    data: worksites.map(presentSummary),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function findWorksite(workshopId: number, id: number) {
  return getWorksiteDetail(prisma, workshopId, id);
}

export async function modifyWorksite(
  workshopId: number,
  id: number,
  data: UpdateWorksiteBody
) {
  return prisma.$transaction(async (tx) => {
    await lockWorksite(tx, workshopId, id, DETAILS_EDITABLE, DETAILS_MESSAGE);
    await tx.worksite.update({ where: { id }, data });
    return getWorksiteDetail(tx, workshopId, id);
  });
}

export async function transitionWorksite(
  workshopId: number,
  id: number,
  target: RequestedWorksiteStatus
) {
  return prisma.$transaction(async (tx) => {
    const worksite = await tx.worksite.findFirst({
      where: { id, workshopId },
      select: { status: true },
    });

    if (!worksite) {
      throw new NotFoundError('Worksite not found');
    }

    if (!canTransitionWorksite(worksite.status, target)) {
      throw new ConflictError(
        `Cannot change worksite status from ${worksite.status} to ${target}`
      );
    }

    // Changement gardé par le statut lu : si un autre appel l'a modifié entre
    // temps, aucune ligne n'est mise à jour. L'UPDATE verrouille aussi la ligne,
    // donc un changement de phase simultané attend puis voit le nouveau statut.
    const { count } = await tx.worksite.updateMany({
      where: { id, workshopId, status: worksite.status },
      data: { status: target },
    });

    if (count === 0) {
      throw new ConflictError('Worksite status has changed, please reload');
    }

    if (target === WorksiteStatus.ready) {
      const notDone = await tx.phase.count({
        where: { worksiteId: id, status: { not: PhaseStatus.done } },
      });

      // Le refus annule la transaction : le chantier garde son statut.
      if (notDone > 0) {
        throw new ConflictError(
          'All phases must be done before the worksite is ready'
        );
      }
    }

    return getWorksiteDetail(tx, workshopId, id);
  });
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export async function addPhase(
  workshopId: number,
  worksiteId: number,
  data: CreatePhaseBody
) {
  return prisma.$transaction(async (tx) => {
    await lockWorksite(
      tx,
      workshopId,
      worksiteId,
      STRUCTURE_EDITABLE,
      STRUCTURE_MESSAGE
    );

    if (data.assigneeId !== undefined) {
      await assertAssigneeInWorkshop(tx, workshopId, data.assigneeId);
    }

    const { _max } = await tx.phase.aggregate({
      where: { worksiteId },
      _max: { position: true },
    });

    await tx.phase.create({
      data: {
        worksiteId,
        position: (_max.position ?? 0) + 1,
        name: data.name,
        estimatedHours: data.estimatedHours,
        notes: data.notes,
        assigneeId: data.assigneeId,
      },
    });

    return getWorksiteDetail(tx, workshopId, worksiteId);
  });
}

export async function modifyPhase(
  workshopId: number,
  worksiteId: number,
  phaseId: number,
  data: UpdatePhaseBody
) {
  // Le statut et le temps réel relèvent de l'avancement : ils ne se modifient
  // que pendant la production. Le reste relève de la structure.
  const touchesProgress =
    data.status !== undefined || data.actualHours !== undefined;

  return prisma.$transaction(async (tx) => {
    await lockWorksite(
      tx,
      workshopId,
      worksiteId,
      touchesProgress ? PROGRESS_EDITABLE : STRUCTURE_EDITABLE,
      touchesProgress ? PROGRESS_MESSAGE : STRUCTURE_MESSAGE
    );

    const phase = await tx.phase.findFirst({
      where: { id: phaseId, worksiteId },
      select: { status: true },
    });

    if (!phase) {
      throw new NotFoundError('Phase not found');
    }

    if (
      data.status !== undefined &&
      data.status !== phase.status &&
      !canTransitionPhase(phase.status, data.status)
    ) {
      throw new ConflictError(
        `Cannot change phase status from ${phase.status} to ${data.status}`
      );
    }

    if (data.assigneeId) {
      await assertAssigneeInWorkshop(tx, workshopId, data.assigneeId);
    }

    await tx.phase.update({ where: { id: phaseId }, data });

    return getWorksiteDetail(tx, workshopId, worksiteId);
  });
}

export async function removePhase(
  workshopId: number,
  worksiteId: number,
  phaseId: number
) {
  return prisma.$transaction(async (tx) => {
    await lockWorksite(
      tx,
      workshopId,
      worksiteId,
      STRUCTURE_EDITABLE,
      STRUCTURE_MESSAGE
    );

    const { count } = await tx.phase.deleteMany({
      where: { id: phaseId, worksiteId },
    });

    if (count === 0) {
      throw new NotFoundError('Phase not found');
    }

    return getWorksiteDetail(tx, workshopId, worksiteId);
  });
}

export async function reorderPhases(
  workshopId: number,
  worksiteId: number,
  phaseIds: number[]
) {
  return prisma.$transaction(async (tx) => {
    await lockWorksite(
      tx,
      workshopId,
      worksiteId,
      STRUCTURE_EDITABLE,
      STRUCTURE_MESSAGE
    );

    const phases = await tx.phase.findMany({
      where: { worksiteId },
      select: { id: true },
    });
    const existingIds = new Set(phases.map((phase) => phase.id));

    if (
      phaseIds.length !== existingIds.size ||
      !phaseIds.every((id) => existingIds.has(id))
    ) {
      throw new ValidationError(
        'phaseIds must list every phase of the worksite exactly once'
      );
    }

    // Deux passes : la contrainte d'unicité (chantier, position) n'est pas
    // différable, donc on libère d'abord les positions avec des valeurs négatives.
    for (const [index, id] of phaseIds.entries()) {
      await tx.phase.update({
        where: { id },
        data: { position: -(index + 1) },
      });
    }
    for (const [index, id] of phaseIds.entries()) {
      await tx.phase.update({ where: { id }, data: { position: index + 1 } });
    }

    return getWorksiteDetail(tx, workshopId, worksiteId);
  });
}
