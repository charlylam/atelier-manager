/** Minuit UTC du jour courant : repère des dates de validité (sans heure). */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/** Date au format AAAA-MM-JJ, ou null. */
export function toDateString(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}
