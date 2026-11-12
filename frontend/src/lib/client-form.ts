import type { Client } from './clients';
import type { ApiErrorDetail } from './errors';

export const CLIENT_FIELDS = [
  'name',
  'isCompany',
  'email',
  'phone',
  'address',
  'notes',
] as const;

export type ClientField = (typeof CLIENT_FIELDS)[number];

// Valeurs du formulaire, toujours sous forme de texte (c'est ce que le navigateur envoie).
export type ClientFormValues = {
  name: string;
  isCompany: 'true' | 'false';
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export type ClientFormState = {
  message?: string;
  fieldErrors: Partial<Record<ClientField, string>>;
  values: ClientFormValues;
};

export const EMPTY_VALUES: ClientFormValues = {
  name: '',
  isCompany: 'false',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

// Messages affichés sous chaque champ, quel que soit le texte de l'API (en anglais).
export const FIELD_MESSAGES: Record<ClientField, string> = {
  name: 'Le nom est obligatoire (150 caractères au plus).',
  isCompany: 'Choisissez un type de client.',
  email: 'Adresse e-mail invalide.',
  phone: 'Numéro de téléphone trop long (30 caractères au plus).',
  address: 'Adresse trop longue (200 caractères au plus).',
  notes: 'Notes trop longues (1 000 caractères au plus).',
};

export const DELETE_CONFLICT_MESSAGE =
  'Ce client a des devis ou des chantiers : il ne peut pas être supprimé.';

export function initialState(
  values: ClientFormValues = EMPTY_VALUES
): ClientFormState {
  return { fieldErrors: {}, values };
}

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** Lit le formulaire : textes sans espaces autour, type de client « false » par défaut. */
export function valuesFromFormData(formData: FormData): ClientFormValues {
  return {
    name: text(formData, 'name'),
    isCompany: text(formData, 'isCompany') === 'true' ? 'true' : 'false',
    email: text(formData, 'email'),
    phone: text(formData, 'phone'),
    address: text(formData, 'address'),
    notes: text(formData, 'notes'),
  };
}

/** Valeurs d'un client existant, pour préremplir le formulaire de modification. */
export function valuesFromClient(client: Client): ClientFormValues {
  return {
    name: client.name,
    isCompany: client.isCompany ? 'true' : 'false',
    email: client.email ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
  };
}

/** Création : les champs facultatifs vides sont omis. */
export function toCreatePayload(values: ClientFormValues) {
  return {
    name: values.name,
    isCompany: values.isCompany === 'true',
    ...(values.email && { email: values.email }),
    ...(values.phone && { phone: values.phone }),
    ...(values.address && { address: values.address }),
    ...(values.notes && { notes: values.notes }),
  };
}

/** Modification : un champ facultatif vidé est envoyé à null, pour l'effacer côté API. */
export function toUpdatePayload(values: ClientFormValues) {
  return {
    name: values.name,
    isCompany: values.isCompany === 'true',
    email: values.email || null,
    phone: values.phone || null,
    address: values.address || null,
    notes: values.notes || null,
  };
}

/** Contrôle fait avant l'appel à l'API : seul le nom est obligatoire. */
export function validateClientValues(values: ClientFormValues) {
  const fieldErrors: ClientFormState['fieldErrors'] = {};
  if (values.name === '') {
    fieldErrors.name = FIELD_MESSAGES.name;
  }
  return fieldErrors;
}

/** Champs refusés par l'API, avec nos messages : les champs inconnus sont ignorés. */
export function fieldErrorsFromApi(details?: ApiErrorDetail[]) {
  const fieldErrors: ClientFormState['fieldErrors'] = {};

  for (const detail of details ?? []) {
    const field = CLIENT_FIELDS.find((name) => name === detail.path);
    if (field) {
      fieldErrors[field] = FIELD_MESSAGES[field];
    }
  }
  return fieldErrors;
}
