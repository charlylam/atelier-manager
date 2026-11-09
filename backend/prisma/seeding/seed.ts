import { hash } from 'argon2';
import {
  LineType,
  PhaseStatus,
  QuoteStatus,
  UserRole,
  WorksiteStatus,
} from '@prisma/client';
import { prisma } from '../../src/lib/prisma.js';

// Comptes de démonstration : tous utilisent ce mot de passe (jeu d'essai public).
const DEMO_PASSWORD = 'Demo2026!';
const VAT_RATE = 20;

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

type LineInput = {
  type: LineType;
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

type PhaseInput = {
  name: string;
  status: PhaseStatus;
  estimatedHours: number;
  actualHours: number;
  assigneeId?: number;
};

const quoteLines = (items: LineInput[]) => ({
  create: items.map((item, index) => ({
    ...item,
    position: index + 1,
    vatRate: VAT_RATE,
  })),
});

const worksitePhases = (items: PhaseInput[]) => ({
  create: items.map((item, index) => ({
    position: index + 1,
    name: item.name,
    status: item.status,
    estimatedHours: item.estimatedHours,
    actualHours: item.actualHours,
    assigneeId: item.assigneeId ?? null,
  })),
});

// Ordre imposé par les contraintes RESTRICT : les enfants avant les parents.
async function resetDatabase() {
  await prisma.phase.deleteMany();
  await prisma.worksite.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workshop.deleteMany();
}

async function main() {
  await resetDatabase();
  const passwordHash = await hash(DEMO_PASSWORD);

  // ---------------------------------------------------------
  // Ateliers et utilisateurs
  // ---------------------------------------------------------
  const martin = await prisma.workshop.create({
    data: { name: 'Atelier Martin' },
  });
  const dubois = await prisma.workshop.create({
    data: { name: 'Menuiserie Dubois' },
  });

  await prisma.user.create({
    data: {
      workshopId: martin.id,
      email: 'admin@atelier-martin.test',
      passwordHash,
      firstName: 'Pierre',
      lastName: 'Martin',
      role: UserRole.admin,
    },
  });
  const member = await prisma.user.create({
    data: {
      workshopId: martin.id,
      email: 'membre@atelier-martin.test',
      passwordHash,
      firstName: 'Sophie',
      lastName: 'Lambert',
      role: UserRole.member,
    },
  });
  await prisma.user.create({
    data: {
      workshopId: dubois.id,
      email: 'admin@menuiserie-dubois.test',
      passwordHash,
      firstName: 'Claire',
      lastName: 'Dubois',
      role: UserRole.admin,
    },
  });

  // ---------------------------------------------------------
  // Clients
  // ---------------------------------------------------------
  const durand = await prisma.client.create({
    data: {
      workshopId: martin.id,
      code: 'CLI-0001',
      name: 'Famille Durand',
      email: 'durand@example.test',
      phone: '04 74 00 00 01',
      address: '12 rue des Tilleuls, 01100 Oyonnax',
    },
  });
  const fournil = await prisma.client.create({
    data: {
      workshopId: martin.id,
      code: 'CLI-0002',
      name: 'Boulangerie Le Fournil',
      isCompany: true,
      email: 'contact@lefournil.example.test',
      address: '3 place du Marché, 01100 Oyonnax',
    },
  });
  const perrin = await prisma.client.create({
    data: {
      workshopId: martin.id,
      code: 'CLI-0003',
      name: 'Hélène Perrin',
      email: 'perrin@example.test',
    },
  });
  const roux = await prisma.client.create({
    data: {
      workshopId: dubois.id,
      code: 'CLI-0001',
      name: 'Marc Roux',
      email: 'roux@example.test',
    },
  });

  // ---------------------------------------------------------
  // Devis de l'atelier Martin
  // ---------------------------------------------------------
  const bibliotheque = await prisma.quote.create({
    data: {
      workshopId: martin.id,
      clientId: durand.id,
      reference: 'DEV-2026-0001',
      title: 'Bibliothèque sur mesure en chêne',
      description:
        'Bibliothèque murale de 2,40 m de large, 5 niveaux, fond plein.',
      status: QuoteStatus.accepted,
      validUntil: day('2026-12-31'),
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Panneaux de chêne massif',
          quantity: 6,
          unit: 'm²',
          unitPrice: 180,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 24,
          unit: 'h',
          unitPrice: 45,
        },
        {
          type: LineType.material,
          label: 'Quincaillerie',
          quantity: 1,
          unit: 'forfait',
          unitPrice: 85,
        },
        {
          type: LineType.service,
          label: 'Pose chez le client',
          quantity: 4,
          unit: 'h',
          unitPrice: 45,
        },
      ]),
    },
  });

  await prisma.quote.create({
    data: {
      workshopId: martin.id,
      clientId: fournil.id,
      reference: 'DEV-2026-0002',
      title: 'Comptoir de vente en frêne',
      status: QuoteStatus.sent,
      validUntil: day('2027-01-31'),
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Frêne massif',
          quantity: 4,
          unit: 'm²',
          unitPrice: 150,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 30,
          unit: 'h',
          unitPrice: 45,
        },
        {
          type: LineType.other,
          label: 'Vernis alimentaire',
          quantity: 1,
          unit: 'forfait',
          unitPrice: 60,
        },
      ]),
    },
  });

  await prisma.quote.create({
    data: {
      workshopId: martin.id,
      clientId: perrin.id,
      reference: 'DEV-2026-0003',
      title: 'Table de salle à manger en noyer',
      status: QuoteStatus.draft,
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Noyer massif',
          quantity: 3,
          unit: 'm²',
          unitPrice: 220,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 20,
          unit: 'h',
          unitPrice: 45,
        },
      ]),
    },
  });

  await prisma.quote.create({
    data: {
      workshopId: martin.id,
      clientId: durand.id,
      reference: 'DEV-2026-0004',
      title: 'Étagères murales',
      status: QuoteStatus.rejected,
      validUntil: day('2026-10-31'),
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Panneaux de pin',
          quantity: 2,
          unit: 'm²',
          unitPrice: 60,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 6,
          unit: 'h',
          unitPrice: 45,
        },
      ]),
    },
  });

  await prisma.quote.create({
    data: {
      workshopId: martin.id,
      clientId: perrin.id,
      reference: 'DEV-2026-0005',
      title: 'Plan de travail en chêne',
      status: QuoteStatus.expired,
      validUntil: day('2026-01-31'),
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Chêne massif',
          quantity: 2,
          unit: 'm²',
          unitPrice: 190,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 8,
          unit: 'h',
          unitPrice: 45,
        },
      ]),
    },
  });

  const porte = await prisma.quote.create({
    data: {
      workshopId: martin.id,
      clientId: fournil.id,
      reference: 'DEV-2026-0006',
      title: "Porte d'entrée vitrée",
      status: QuoteStatus.accepted,
      validUntil: day('2026-08-31'),
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Chêne et vitrage',
          quantity: 1,
          unit: 'forfait',
          unitPrice: 650,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 16,
          unit: 'h',
          unitPrice: 45,
        },
        {
          type: LineType.service,
          label: 'Pose',
          quantity: 3,
          unit: 'h',
          unitPrice: 45,
        },
      ]),
    },
  });

  // Même référence que le devis de l'atelier Martin : l'unicité vaut par atelier.
  await prisma.quote.create({
    data: {
      workshopId: dubois.id,
      clientId: roux.id,
      reference: 'DEV-2026-0001',
      title: 'Meuble TV',
      status: QuoteStatus.sent,
      validUntil: day('2027-02-28'),
      lines: quoteLines([
        {
          type: LineType.material,
          label: 'Panneaux de hêtre',
          quantity: 3,
          unit: 'm²',
          unitPrice: 120,
        },
        {
          type: LineType.labor,
          label: 'Fabrication en atelier',
          quantity: 10,
          unit: 'h',
          unitPrice: 40,
        },
      ]),
    },
  });

  // ---------------------------------------------------------
  // Chantiers et phases
  // ---------------------------------------------------------
  await prisma.worksite.create({
    data: {
      workshopId: martin.id,
      clientId: durand.id,
      quoteId: bibliotheque.id,
      reference: 'CH-2026-0001',
      title: 'Bibliothèque sur mesure en chêne',
      status: WorksiteStatus.in_production,
      dueDate: day('2026-12-15'),
      phases: worksitePhases([
        {
          name: 'Débit',
          status: PhaseStatus.done,
          estimatedHours: 6,
          actualHours: 7,
        },
        {
          name: 'Usinage',
          status: PhaseStatus.done,
          estimatedHours: 8,
          actualHours: 7.5,
        },
        {
          name: 'Assemblage',
          status: PhaseStatus.in_progress,
          estimatedHours: 10,
          actualHours: 4,
          assigneeId: member.id,
        },
        {
          name: 'Finition',
          status: PhaseStatus.todo,
          estimatedHours: 6,
          actualHours: 0,
        },
        {
          name: 'Pose',
          status: PhaseStatus.todo,
          estimatedHours: 4,
          actualHours: 0,
        },
      ]),
    },
  });

  await prisma.worksite.create({
    data: {
      workshopId: martin.id,
      clientId: fournil.id,
      quoteId: porte.id,
      reference: 'CH-2026-0002',
      title: "Porte d'entrée vitrée",
      siteAddress: '3 impasse des Artisans, 01100 Oyonnax',
      status: WorksiteStatus.delivered,
      dueDate: day('2026-09-30'),
      phases: worksitePhases([
        {
          name: 'Débit',
          status: PhaseStatus.done,
          estimatedHours: 3,
          actualHours: 3,
        },
        {
          name: 'Assemblage',
          status: PhaseStatus.done,
          estimatedHours: 8,
          actualHours: 9,
        },
        {
          name: 'Finition',
          status: PhaseStatus.done,
          estimatedHours: 5,
          actualHours: 5,
        },
        {
          name: 'Pose',
          status: PhaseStatus.done,
          estimatedHours: 3,
          actualHours: 3,
        },
      ]),
    },
  });

  console.log(
    'Jeu d’essai créé : 2 ateliers, 3 utilisateurs, 4 clients, 7 devis, 2 chantiers'
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
