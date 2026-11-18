import { fieldErrorsFromDetails } from './form-errors';
import type { ApiErrorDetail } from './errors';
import type { Worksite } from './worksites';

export const WORKSITE_FIELDS = [
  'title',
  'description',
  'siteAddress',
  'dueDate',
] as const;

export type WorksiteField = (typeof WORKSITE_FIELDS)[number];

// Valeurs du formulaire, toujours sous forme de texte (c'est ce que le navigateur envoie).
export type WorksiteFormValues = Record<WorksiteField, string>;

export type WorksiteFormState = {
  message?: string;
  fieldErrors: Partial<Record<WorksiteField, string>>;
  values: WorksiteFormValues;
};

export const WORKSITE_FIELD_MESSAGES: Record<WorksiteField, string> = {
  title: 'Le titre est obligatoire (200 caractères au plus).',
  description: 'Description trop longue (2 000 caractères au plus).',
  siteAddress: 'Adresse trop longue (200 caractères au plus).',
  dueDate: 'La date d’échéance est invalide.',
};

export const NOT_EDITABLE_MESSAGE =
  'Ce chantier est livré ou annulé : il ne peut plus être modifié.';

export const WORKSITE_GONE_MESSAGE = 'Ce chantier n’existe plus.';

/**
 * Clé qui change quand les valeurs initiales du formulaire changent. L'état d'un formulaire
 * (useActionState) n'est lu depuis les props qu'au premier rendu de l'instance, et Next.js garde
 * une page quittée montée (Activity) : sans cette clé, un formulaire rouvert après un
 * enregistrement garde les anciennes valeurs. Les champs sont lus dans l'ordre de WORKSITE_FIELDS,
 * indépendant de l'ordre des propriétés de l'objet.
 */
export function worksiteValuesKey(values: WorksiteFormValues) {
  return JSON.stringify(WORKSITE_FIELDS.map((field) => values[field]));
}

export function worksiteInitialState(
  values: WorksiteFormValues
): WorksiteFormState {
  return { fieldErrors: {}, values };
}

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** Lit le formulaire : textes sans espaces autour. */
export function worksiteValuesFromFormData(
  formData: FormData
): WorksiteFormValues {
  return {
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    siteAddress: text(formData, 'siteAddress'),
    dueDate: text(formData, 'dueDate'),
  };
}

/** Valeurs d'un chantier existant, pour préremplir le formulaire de modification. */
export function worksiteValuesFromWorksite(
  worksite: Worksite
): WorksiteFormValues {
  return {
    title: worksite.title,
    description: worksite.description ?? '',
    siteAddress: worksite.siteAddress ?? '',
    dueDate: worksite.dueDate?.slice(0, 10) ?? '',
  };
}

/**
 * Modification : un champ vidé est envoyé à null, pour l'effacer côté API. Une adresse vidée
 * ramène le chantier à l'adresse du client. Les quatre champs sont toujours envoyés : l'API
 * exige au moins un champ.
 */
export function toUpdateWorksitePayload(values: WorksiteFormValues) {
  return {
    title: values.title,
    description: values.description || null,
    siteAddress: values.siteAddress || null,
    dueDate: values.dueDate || null,
  };
}

/** Contrôle fait avant l'appel à l'API. Une échéance passée est acceptée (chantier en retard). */
export function validateWorksiteValues(values: WorksiteFormValues) {
  const fieldErrors: WorksiteFormState['fieldErrors'] = {};

  if (values.title === '' || values.title.length > 200) {
    fieldErrors.title = WORKSITE_FIELD_MESSAGES.title;
  }
  if (values.description.length > 2000) {
    fieldErrors.description = WORKSITE_FIELD_MESSAGES.description;
  }
  if (values.siteAddress.length > 200) {
    fieldErrors.siteAddress = WORKSITE_FIELD_MESSAGES.siteAddress;
  }
  if (values.dueDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
    fieldErrors.dueDate = WORKSITE_FIELD_MESSAGES.dueDate;
  }
  return fieldErrors;
}

export function worksiteFieldErrorsFromApi(details?: ApiErrorDetail[]) {
  return fieldErrorsFromDetails(
    WORKSITE_FIELDS,
    WORKSITE_FIELD_MESSAGES,
    details
  );
}
