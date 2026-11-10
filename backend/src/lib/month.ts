/** Bornes UTC d'un mois au format "AAAA-MM" (le mois courant si absent). */
export function monthRange(month?: string) {
  const now = new Date();
  const [year, monthNumber] = month
    ? month.split('-').map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  return {
    label: `${year}-${String(monthNumber).padStart(2, '0')}`,
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    end: new Date(Date.UTC(year, monthNumber, 1)),
  };
}
