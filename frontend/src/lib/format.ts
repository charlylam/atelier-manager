const EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/** "2412.00" devient "2 412,00 €" (affichage seulement : les calculs restent côté API). */
export function formatMoney(value: string) {
  return EURO.format(Number(value));
}

/**
 * "2026-12-15" devient "15/12/2026". Accepte aussi une date-heure ISO
 * ("2026-12-15T00:00:00.000Z"), forme que renvoie la fiche client : seuls les
 * dix premiers caractères (la date) sont lus.
 */
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
