// Mise en forme française des montants, quantités et dates pour le PDF.
// Les espaces sont de simples espaces : les polices PDF standard n'ont pas
// d'espace insécable fine.

/** "1080.00" devient "1 080,00 €". */
export function formatMoney(value: string): string {
  const [integer, decimals = '00'] = value.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${decimals.padEnd(2, '0')} €`;
}

/** "6.00" devient "6" et "1.50" devient "1,5". */
export function formatQuantity(value: string): string {
  const trimmed = value.includes('.') ? value.replace(/\.?0+$/, '') : value;
  return trimmed.replace('.', ',');
}

/** Date au format JJ/MM/AAAA, lue en UTC. Accepte un Date ou "AAAA-MM-JJ". */
export function formatDateFr(date: Date | string): string {
  const value =
    typeof date === 'string' ? new Date(`${date}T00:00:00.000Z`) : date;
  const day = String(value.getUTCDate()).padStart(2, '0');
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${value.getUTCFullYear()}`;
}
