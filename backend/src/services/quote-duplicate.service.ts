import { prisma } from '../lib/prisma.js';
import { NotFoundError } from '../lib/errors.js';
import { retryOnUniqueViolation } from '../lib/retry.js';
import { getQuoteDetail, nextQuoteReference } from './quote.service.js';

/**
 * Copie un devis en nouveau brouillon : même client, titre, description et
 * lignes. La date de validité n'est pas reprise (elle peut être dépassée).
 */
export async function duplicateQuote(workshopId: number, sourceId: number) {
  const year = new Date().getUTCFullYear();

  return retryOnUniqueViolation(
    () =>
      prisma.$transaction(async (tx) => {
        const source = await tx.quote.findFirst({
          where: { id: sourceId, workshopId },
          select: {
            clientId: true,
            title: true,
            description: true,
            lines: {
              select: {
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
          },
        });

        if (!source) {
          throw new NotFoundError('Quote not found');
        }

        const reference = await nextQuoteReference(tx, workshopId, year);
        const copy = await tx.quote.create({
          data: {
            workshopId,
            clientId: source.clientId,
            reference,
            title: source.title,
            description: source.description,
            lines: { create: source.lines },
          },
          select: { id: true },
        });

        return getQuoteDetail(tx, workshopId, copy.id);
      }),
    'Could not allocate a quote reference, please retry'
  );
}
