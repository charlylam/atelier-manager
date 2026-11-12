import { QUOTE_STATUSES } from './labels';
import type { QuoteStatus } from './labels';

/** Statut reçu dans l'URL (?status=sent) : undefined s'il n'en est pas un, sans erreur de l'API. */
export function parseQuoteStatus(value?: string): QuoteStatus | undefined {
  return QUOTE_STATUSES.find((status) => status === value);
}
