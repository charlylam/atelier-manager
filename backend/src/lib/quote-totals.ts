import { Prisma } from '@prisma/client';

type Amount = Prisma.Decimal | string | number;

export type LineAmounts = {
  quantity: Amount;
  unitPrice: Amount;
  vatRate: Amount;
};

// Arrondi au demi supérieur (decimal.js : ROUND_HALF_UP = 4).
const ROUND_HALF_UP = 4;
const round2 = (value: Prisma.Decimal) =>
  value.toDecimalPlaces(2, ROUND_HALF_UP);

/** Montants d'une ligne : total HT, TVA et total TTC, arrondis à 2 décimales. */
export function computeLine(line: LineAmounts) {
  const totalExclTax = round2(
    new Prisma.Decimal(line.quantity).mul(line.unitPrice)
  );
  const vat = round2(totalExclTax.mul(line.vatRate).div(100));

  return { totalExclTax, vat, totalInclTax: totalExclTax.plus(vat) };
}

/**
 * Totaux d'un devis : la TVA est calculée ligne par ligne, puis additionnée.
 * Les montants sont renvoyés en chaînes à 2 décimales.
 */
export function computeTotals(lines: LineAmounts[]) {
  let totalExclTax = new Prisma.Decimal(0);
  let totalVat = new Prisma.Decimal(0);

  for (const line of lines) {
    const amounts = computeLine(line);
    totalExclTax = totalExclTax.plus(amounts.totalExclTax);
    totalVat = totalVat.plus(amounts.vat);
  }

  return {
    totalExclTax: totalExclTax.toFixed(2),
    totalVat: totalVat.toFixed(2),
    totalInclTax: totalExclTax.plus(totalVat).toFixed(2),
  };
}
