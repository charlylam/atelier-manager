import type { ApiErrorDetail } from './errors';

/**
 * Champs refusés par l'API (détail d'une erreur de validation), avec nos messages en
 * français : les champs que le formulaire ne connaît pas sont ignorés.
 */
export function fieldErrorsFromDetails<K extends string>(
  fields: readonly K[],
  messages: Record<K, string>,
  details?: ApiErrorDetail[]
) {
  const fieldErrors: Partial<Record<K, string>> = {};

  for (const detail of details ?? []) {
    const field = fields.find((name) => name === detail.path);
    if (field) {
      fieldErrors[field] = messages[field];
    }
  }
  return fieldErrors;
}
