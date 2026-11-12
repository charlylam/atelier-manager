// Mois au format "AAAA-MM", comme le paramètre ?month= de l'API.
// Seules les années 2000 à 2099 sont acceptées : un mois hors de cette plage
// est ignoré (mois courant), sans appel à l'API.
const MONTH_PATTERN = /^20\d{2}-(0[1-9]|1[0-2])$/;

/** Le mois reçu dans l'URL s'il est valide, sinon undefined. */
export function parseMonth(value?: string) {
  return value && MONTH_PATTERN.test(value) ? value : undefined;
}

/** Mois décalé de `delta` mois : shiftMonth('2026-12', 1) donne '2027-01'. */
export function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
    .toISOString()
    .slice(0, 7);
}

/** "2026-09" devient "septembre 2026". */
export function formatMonth(month: string) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
}
