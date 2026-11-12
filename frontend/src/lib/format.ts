const EURO = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

/** "2412.00" devient "2 412,00 €" (affichage seulement : les calculs restent côté API). */
export function formatMoney(value: string) {
  return EURO.format(Number(value));
}

/** "2026-12-15" devient "15/12/2026". */
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
