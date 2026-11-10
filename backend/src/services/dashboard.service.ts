import { Prisma, QuoteStatus, WorksiteStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { startOfToday, toDateString } from '../lib/dates.js';
import { monthRange } from '../lib/month.js';
import { computeTotals } from '../lib/quote-totals.js';
import { expireOverdueQuotes } from './quote.service.js';

const LATE_LIST_LIMIT = 10;
const DAY_MS = 86_400_000;

// Un chantier est en retard tant qu'il n'est ni livré ni annulé et que son
// échéance (date de livraison prévue) est dépassée.
const LATE_STATUSES: WorksiteStatus[] = ['pending', 'in_production', 'ready'];

// Compte par statut, avec 0 pour les statuts absents des résultats.
function countsByStatus<T extends string>(
  statuses: readonly T[],
  rows: { status: T; _count: { _all: number } }[]
) {
  const counts = Object.fromEntries(
    statuses.map((status) => [status, 0])
  ) as Record<T, number>;

  for (const row of rows) {
    counts[row.status] = row._count._all;
  }
  return counts;
}

async function worksiteSection(workshopId: number, today: Date) {
  const lateWhere: Prisma.WorksiteWhereInput = {
    workshopId,
    status: { in: LATE_STATUSES },
    dueDate: { lt: today },
  };

  const [rows, lateTotal, lateItems] = await Promise.all([
    prisma.worksite.groupBy({
      by: ['status'],
      where: { workshopId },
      _count: { _all: true },
    }),
    prisma.worksite.count({ where: lateWhere }),
    prisma.worksite.findMany({
      where: lateWhere,
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
      take: LATE_LIST_LIMIT,
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        dueDate: true,
        client: { select: { id: true, code: true, name: true } },
      },
    }),
  ]);

  return {
    byStatus: countsByStatus(Object.values(WorksiteStatus), rows),
    late: {
      total: lateTotal,
      items: lateItems.map(({ dueDate, ...item }) => ({
        ...item,
        dueDate: toDateString(dueDate),
        // dueDate n'est jamais nul ici : le filtre "lt" exclut les chantiers sans échéance.
        daysLate: Math.floor((today.getTime() - dueDate!.getTime()) / DAY_MS),
      })),
    },
  };
}

async function quoteSection(workshopId: number) {
  // Un devis envoyé dont la date de validité est dépassée devient "expired"
  // avant le comptage : il n'est plus "en attente".
  await expireOverdueQuotes(prisma, workshopId);

  const [rows, sent] = await Promise.all([
    prisma.quote.groupBy({
      by: ['status'],
      where: { workshopId },
      _count: { _all: true },
    }),
    prisma.quote.findMany({
      where: { workshopId, status: QuoteStatus.sent },
      select: {
        lines: { select: { quantity: true, unitPrice: true, vatRate: true } },
      },
    }),
  ]);

  const totalInclTax = sent.reduce(
    (total, quote) => total.plus(computeTotals(quote.lines).totalInclTax),
    new Prisma.Decimal(0)
  );

  return {
    byStatus: countsByStatus(Object.values(QuoteStatus), rows),
    // Devis envoyés : le client n'a pas encore répondu.
    pending: { count: sent.length, totalInclTax: totalInclTax.toFixed(2) },
  };
}

// Chiffre d'affaires du mois : montant des devis des chantiers livrés dans le mois.
async function revenueSection(workshopId: number, month?: string) {
  const { label, start, end } = monthRange(month);

  const delivered = await prisma.worksite.findMany({
    where: {
      workshopId,
      status: WorksiteStatus.delivered,
      deliveredAt: { gte: start, lt: end },
    },
    select: {
      quote: {
        select: {
          lines: { select: { quantity: true, unitPrice: true, vatRate: true } },
        },
      },
    },
  });

  let totalExclTax = new Prisma.Decimal(0);
  let totalVat = new Prisma.Decimal(0);

  for (const worksite of delivered) {
    const totals = computeTotals(worksite.quote.lines);
    totalExclTax = totalExclTax.plus(totals.totalExclTax);
    totalVat = totalVat.plus(totals.totalVat);
  }

  return {
    month: label,
    deliveredWorksites: delivered.length,
    totalExclTax: totalExclTax.toFixed(2),
    totalVat: totalVat.toFixed(2),
    totalInclTax: totalExclTax.plus(totalVat).toFixed(2),
  };
}

export async function getDashboard(workshopId: number, month?: string) {
  const today = startOfToday();

  const [worksites, quotes, revenue] = await Promise.all([
    worksiteSection(workshopId, today),
    quoteSection(workshopId),
    revenueSection(workshopId, month),
  ]);

  return { worksites, quotes, revenue };
}
