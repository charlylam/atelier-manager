import { WORKSITE_STATUSES } from './labels';
import type { WorksiteStatus } from './labels';

/** Statut reçu dans l'URL (?status=ready) : undefined s'il n'en est pas un, sans erreur de l'API. */
export function parseWorksiteStatus(
  value?: string
): WorksiteStatus | undefined {
  return WORKSITE_STATUSES.find((status) => status === value);
}
