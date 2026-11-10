import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import { toDateString } from '../lib/dates.js';
import { computeLine, computeTotals } from '../lib/quote-totals.js';
import { renderQuotePdf } from '../lib/quote-pdf.js';
import { expireOverdueQuotes } from './quote.service.js';

export async function buildQuotePdf(workshopId: number, id: number) {
  // Même règle d'expiration que la consultation : le statut imprimé est à jour.
  await expireOverdueQuotes(prisma, workshopId);

  const quote = await prisma.quote.findFirst({
    where: { id, workshopId },
    select: {
      reference: true,
      title: true,
      description: true,
      status: true,
      validUntil: true,
      createdAt: true,
      workshop: { select: { name: true } },
      client: {
        select: {
          code: true,
          name: true,
          address: true,
          phone: true,
          email: true,
        },
      },
      lines: {
        select: {
          label: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          vatRate: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  const buffer = await renderQuotePdf({
    workshopName: quote.workshop.name,
    reference: quote.reference,
    status: quote.status,
    title: quote.title,
    description: quote.description,
    createdAt: quote.createdAt,
    validUntil: toDateString(quote.validUntil),
    client: quote.client,
    lines: quote.lines.map((line) => ({
      label: line.label,
      quantity: line.quantity.toFixed(2),
      unit: line.unit,
      unitPrice: line.unitPrice.toFixed(2),
      vatRate: line.vatRate.toFixed(2),
      totalExclTax: computeLine(line).totalExclTax.toFixed(2),
    })),
    totals: computeTotals(quote.lines),
  });

  return { reference: quote.reference, buffer };
}
