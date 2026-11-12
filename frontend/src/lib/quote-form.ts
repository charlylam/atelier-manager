import { fieldErrorsFromDetails } from './form-errors';
import type { ApiErrorDetail } from './errors';
import type { Quote } from './quotes';

export const QUOTE_FIELDS = [
  'clientId',
  'title',
  'description',
  'validUntil',
] as const;

export type QuoteField = (typeof QUOTE_FIELDS)[number];

// Valeurs du formulaire, toujours sous forme de texte (c'est ce que le navigateur envoie).
export type QuoteFormValues = Record<QuoteField, string>;

export type QuoteFormState = {
  message?: string;
  fieldErrors: Partial<Record<QuoteField, string>>;
  values: QuoteFormValues;
};

export const EMPTY_QUOTE_VALUES: QuoteFormValues = {
  clientId: '',
  title: '',
  description: '',
  validUntil: '',
};

export const QUOTE_FIELD_MESSAGES: Record<QuoteField, string> = {
  clientId: 'Choisissez un client.',
  title: 'Le titre est obligatoire (200 caractères au plus).',
  description: 'Description trop longue (2 000 caractères au plus).',
  validUntil: 'La date de validité est invalide ou déjà passée.',
};

export const NOT_DRAFT_MESSAGE =
  'Ce devis n’est plus un brouillon : il ne peut plus être modifié.';

export function quoteInitialState(
  values: QuoteFormValues = EMPTY_QUOTE_VALUES
): QuoteFormState {
  return { fieldErrors: {}, values };
}

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** Lit le formulaire : textes sans espaces autour. */
export function quoteValuesFromFormData(formData: FormData): QuoteFormValues {
  return {
    clientId: text(formData, 'clientId'),
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    validUntil: text(formData, 'validUntil'),
  };
}

/** Valeurs d'un devis existant, pour préremplir le formulaire de modification. */
export function quoteValuesFromQuote(quote: Quote): QuoteFormValues {
  return {
    clientId: String(quote.client.id),
    title: quote.title,
    description: quote.description ?? '',
    validUntil: quote.validUntil?.slice(0, 10) ?? '',
  };
}

/** Création : la description et la date de validité vides sont omises. */
export function toCreateQuotePayload(values: QuoteFormValues) {
  return {
    clientId: Number(values.clientId),
    title: values.title,
    ...(values.description && { description: values.description }),
    ...(values.validUntil && { validUntil: values.validUntil }),
  };
}

/** Modification : une description ou une date vidée est envoyée à null, pour l'effacer côté API. */
export function toUpdateQuotePayload(values: QuoteFormValues) {
  return {
    clientId: Number(values.clientId),
    title: values.title,
    description: values.description || null,
    validUntil: values.validUntil || null,
  };
}

/** Contrôle fait avant l'appel à l'API : un client et un titre. */
export function validateQuoteValues(values: QuoteFormValues) {
  const fieldErrors: QuoteFormState['fieldErrors'] = {};

  if (!/^\d+$/.test(values.clientId) || Number(values.clientId) < 1) {
    fieldErrors.clientId = QUOTE_FIELD_MESSAGES.clientId;
  }
  if (values.title === '' || values.title.length > 200) {
    fieldErrors.title = QUOTE_FIELD_MESSAGES.title;
  }
  if (values.description.length > 2000) {
    fieldErrors.description = QUOTE_FIELD_MESSAGES.description;
  }
  if (
    values.validUntil !== '' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(values.validUntil)
  ) {
    fieldErrors.validUntil = QUOTE_FIELD_MESSAGES.validUntil;
  }
  return fieldErrors;
}

export function quoteFieldErrorsFromApi(details?: ApiErrorDetail[]) {
  return fieldErrorsFromDetails(QUOTE_FIELDS, QUOTE_FIELD_MESSAGES, details);
}
