import { Prisma, QuoteStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { isUniqueViolation } from '../lib/prisma-errors.js';
import { startOfToday, toDateString } from '../lib/dates.js';
import { computeLine, computeTotals } from '../lib/quote-totals.js';
import { canTransition } from '../lib/quote-status.js';
import type {
  CreateLineBody,
  CreateQuoteBody,
  ListQuotesQuery,
  RequestedQuoteStatus,
  UpdateLineBody,
  UpdateQuoteBody,
} from '../validators/quote.validator.js';

type Db = Prisma.TransactionClient;

const MAX_ATTEMPTS = 5;
const REFERENCE_PREFIX = 'DEV-';

// ---------------------------------------------------------------------------
// Sélections et présentation
// ---------------------------------------------------------------------------

const quoteDetailSelect = {
  id: true,
  reference: true,
  title: true,
  description: true,
  status: true,
  validUntil: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, code: true, name: true } },
  lines: {
    select: {
      id: true,
      position: true,
      type: true,
      label: true,
      quantity: true,
      unit: true,
      unitPrice: true,
      vatRate: true,
    },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.QuoteSelect;

const quoteSummarySelect = {
  id: true,
  reference: true,
  title: true,
  status: true,
  validUntil: true,
  createdAt: true,
  client: { select: { id: true, code: true, name: true } },
  lines: { select: { quantity: true, unitPrice: true, vatRate: true } },
} satisfies Prisma.QuoteSelect;

type QuoteDetail = Prisma.QuoteGetPayload<{ select: typeof quoteDetailSelect }>;
type QuoteSummary = Prisma.QuoteGetPayload<{
  select: typeof quoteSummarySelect;
}>;

function presentLine(line: QuoteDetail['lines'][number]) {
  return {
    id: line.id,
    position: line.position,
    type: line.type,
    label: line.label,
    quantity: line.quantity.toFixed(2),
    unit: line.unit,
    unitPrice: line.unitPrice.toFixed(2),
    vatRate: line.vatRate.toFixed(2),
    totalExclTax: computeLine(line).totalExclTax.toFixed(2),
  };
}

function presentQuote(quote: QuoteDetail) {
  const { lines, validUntil, ...rest } = quote;
  return {
    ...rest,
    validUntil: toDateString(validUntil),
    lines: lines.map(presentLine),
    totals: computeTotals(lines),
  };
}

function presentSummary(quote: QuoteSummary) {
  const { lines, validUntil, ...rest } = quote;
  return {
    ...rest,
    validUntil: toDateString(validUntil),
    totalInclTax: computeTotals(lines).totalInclTax,
  };
}

async function getQuoteDetail(db: Db, workshopId: number, id: number) {
  const quote = await db.quote.findFirst({
    where: { id, workshopId },
    select: quoteDetailSelect,
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  return presentQuote(quote);
}

// ---------------------------------------------------------------------------
// Règles communes
// ---------------------------------------------------------------------------

// Un devis envoyé dont la date de validité est dépassée devient "expired".
// Vérifié à la consultation : il n'y a pas de tâche planifiée.
async function expireOverdueQuotes(db: Db, workshopId: number) {
  await db.quote.updateMany({
    where: {
      workshopId,
      status: QuoteStatus.sent,
      validUntil: { lt: startOfToday() },
    },
    data: { status: QuoteStatus.expired },
  });
}

// Garde des modifications : seul un brouillon de l'atelier peut être modifié.
// L'UPDATE verrouille la ligne du devis jusqu'à la fin de la transaction, donc
// un changement de statut simultané attend, puis voit le brouillon figé.
async function lockDraftQuote(db: Db, workshopId: number, quoteId: number) {
  const { count } = await db.quote.updateMany({
    where: { id: quoteId, workshopId, status: QuoteStatus.draft },
    data: { updatedAt: new Date() },
  });

  if (count === 1) {
    return;
  }

  const exists = await db.quote.findFirst({
    where: { id: quoteId, workshopId },
    select: { id: true },
  });

  if (!exists) {
    throw new NotFoundError('Quote not found');
  }
  throw new ConflictError('Only a draft quote can be modified');
}

async function assertClientInWorkshop(
  db: Db,
  workshopId: number,
  clientId: number
) {
  const client = await db.client.findFirst({
    where: { id: clientId, workshopId },
    select: { id: true },
  });

  if (!client) {
    throw new NotFoundError('Client not found');
  }
}

// Référence suivante dans l'atelier pour l'année : DEV-2026-0001, 0002...
async function nextQuoteReference(db: Db, workshopId: number, year: number) {
  const prefix = `${REFERENCE_PREFIX}${year}-`;
  const last = await db.quote.findFirst({
    where: { workshopId, reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  const lastNumber = last ? Number(last.reference.slice(prefix.length)) : 0;
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Devis
// ---------------------------------------------------------------------------

export async function searchQuotes(workshopId: number, query: ListQuotesQuery) {
  const { status, clientId, search, page, limit } = query;
  await expireOverdueQuotes(prisma, workshopId);

  const where: Prisma.QuoteWhereInput = {
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

  const [quotes, total] = await prisma.$transaction([
    prisma.quote.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: quoteSummarySelect,
    }),
    prisma.quote.count({ where }),
  ]);

  return {
    data: quotes.map(presentSummary),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function findQuote(workshopId: number, id: number) {
  await expireOverdueQuotes(prisma, workshopId);
  return getQuoteDetail(prisma, workshopId, id);
}

export async function createQuote(workshopId: number, data: CreateQuoteBody) {
  await assertClientInWorkshop(prisma, workshopId, data.clientId);
  const year = new Date().getUTCFullYear();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const reference = await nextQuoteReference(tx, workshopId, year);
        const quote = await tx.quote.create({
          data: {
            workshopId,
            clientId: data.clientId,
            reference,
            title: data.title,
            description: data.description,
            validUntil: data.validUntil,
          },
          select: { id: true },
        });
        return getQuoteDetail(tx, workshopId, quote.id);
      });
    } catch (error) {
      // Deux créations simultanées peuvent calculer la même référence : la
      // contrainte d'unicité (workshop_id, reference) refuse la seconde.
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new ConflictError('Could not allocate a quote reference, please retry');
}

export async function modifyQuote(
  workshopId: number,
  id: number,
  data: UpdateQuoteBody
) {
  return prisma.$transaction(async (tx) => {
    await lockDraftQuote(tx, workshopId, id);

    if (data.clientId !== undefined) {
      await assertClientInWorkshop(tx, workshopId, data.clientId);
    }

    await tx.quote.update({ where: { id }, data });
    return getQuoteDetail(tx, workshopId, id);
  });
}

export async function transitionQuote(
  workshopId: number,
  id: number,
  target: RequestedQuoteStatus
) {
  // Hors transaction : l'expiration doit rester enregistrée même si le
  // changement demandé est refusé.
  await expireOverdueQuotes(prisma, workshopId);

  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirst({
      where: { id, workshopId },
      select: { status: true, validUntil: true },
    });

    if (!quote) {
      throw new NotFoundError('Quote not found');
    }

    if (!canTransition(quote.status, target)) {
      throw new ConflictError(
        `Cannot change quote status from ${quote.status} to ${target}`
      );
    }

    if (
      target === QuoteStatus.sent &&
      quote.validUntil &&
      quote.validUntil < startOfToday()
    ) {
      throw new ConflictError('Quote validity date is in the past');
    }

    // Changement gardé par le statut lu : si un autre appel l'a modifié entre
    // temps, aucune ligne n'est mise à jour.
    const { count } = await tx.quote.updateMany({
      where: { id, workshopId, status: quote.status },
      data: { status: target },
    });

    if (count === 0) {
      throw new ConflictError('Quote status has changed, please reload');
    }

    if (target === QuoteStatus.sent) {
      const lineCount = await tx.quoteLine.count({ where: { quoteId: id } });
      if (lineCount === 0) {
        throw new ConflictError('A quote without lines cannot be sent');
      }
    }

    return getQuoteDetail(tx, workshopId, id);
  });
}

// ---------------------------------------------------------------------------
// Lignes
// ---------------------------------------------------------------------------

export async function insertLine(
  workshopId: number,
  quoteId: number,
  data: CreateLineBody
) {
  return prisma.$transaction(async (tx) => {
    await lockDraftQuote(tx, workshopId, quoteId);

    const { _max } = await tx.quoteLine.aggregate({
      where: { quoteId },
      _max: { position: true },
    });

    await tx.quoteLine.create({
      data: { quoteId, position: (_max.position ?? 0) + 1, ...data },
    });

    return getQuoteDetail(tx, workshopId, quoteId);
  });
}

export async function modifyLine(
  workshopId: number,
  quoteId: number,
  lineId: number,
  data: UpdateLineBody
) {
  return prisma.$transaction(async (tx) => {
    await lockDraftQuote(tx, workshopId, quoteId);

    const { count } = await tx.quoteLine.updateMany({
      where: { id: lineId, quoteId },
      data,
    });

    if (count === 0) {
      throw new NotFoundError('Line not found');
    }

    return getQuoteDetail(tx, workshopId, quoteId);
  });
}

export async function deleteLine(
  workshopId: number,
  quoteId: number,
  lineId: number
) {
  return prisma.$transaction(async (tx) => {
    await lockDraftQuote(tx, workshopId, quoteId);

    const { count } = await tx.quoteLine.deleteMany({
      where: { id: lineId, quoteId },
    });

    if (count === 0) {
      throw new NotFoundError('Line not found');
    }

    return getQuoteDetail(tx, workshopId, quoteId);
  });
}
