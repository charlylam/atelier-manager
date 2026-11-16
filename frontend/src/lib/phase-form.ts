import { normalizeDecimal } from './line-form';
import { fieldErrorsFromDetails } from './form-errors';
import type { ApiErrorDetail } from './errors';
import type { Phase } from './worksites';

export const PHASE_FIELDS = ['name', 'estimatedHours', 'notes'] as const;

export type PhaseField = (typeof PHASE_FIELDS)[number];

// Valeurs du formulaire, toujours sous forme de texte (c'est ce que le navigateur envoie).
export type PhaseFormValues = Record<PhaseField, string>;

export type PhaseFormState = {
  message?: string;
  fieldErrors: Partial<Record<PhaseField, string>>;
  values: PhaseFormValues;
};

// Une phase neuve : sans estimation, l'API la compte pour 0 heure.
export const EMPTY_PHASE_VALUES: PhaseFormValues = {
  name: '',
  estimatedHours: '',
  notes: '',
};

export const PHASE_FIELD_MESSAGES: Record<PhaseField, string> = {
  name: 'Le nom est obligatoire (100 caractères au plus).',
  estimatedHours:
    'Nombre d’heures invalide : 4 chiffres au plus, avec 2 décimales au plus.',
  notes: 'Notes trop longues (1 000 caractères au plus).',
};

export const PHASE_STRUCTURE_MESSAGE =
  'Les phases ne peuvent être modifiées que pour un chantier en attente ou en fabrication.';

export function phaseInitialState(
  values: PhaseFormValues = EMPTY_PHASE_VALUES
): PhaseFormState {
  return { fieldErrors: {}, values };
}

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** Lit le formulaire : textes sans espaces autour, heures écrites avec un point. */
export function phaseValuesFromFormData(formData: FormData): PhaseFormValues {
  return {
    name: text(formData, 'name'),
    estimatedHours: normalizeDecimal(text(formData, 'estimatedHours')),
    notes: text(formData, 'notes'),
  };
}

/**
 * Création : l'estimation et les notes vides sont omises. Les heures restent une chaîne
 * décimale ("7.50"), sans passer par un nombre à virgule flottante.
 */
export function toCreatePhasePayload(values: PhaseFormValues) {
  return {
    name: values.name,
    ...(values.estimatedHours && { estimatedHours: values.estimatedHours }),
    ...(values.notes && { notes: values.notes }),
  };
}

// Colonne de la base : 4 chiffres avant la virgule, 2 après.
const HOURS = /^\d{1,4}(\.\d{1,2})?$/;

export function isValidHours(value: string) {
  return HOURS.test(value);
}

/**
 * Modification de la structure (nom, estimation, notes) : les notes vidées partent à null pour
 * être effacées. Une estimation vidée compte pour 0 heure, comme à la création. Le statut et le
 * temps réel ne sont jamais envoyés ici : l'API les réserve à la fabrication.
 */
export function toUpdatePhasePayload(values: PhaseFormValues) {
  return {
    name: values.name,
    estimatedHours: values.estimatedHours || '0',
    notes: values.notes || null,
  };
}

/** Valeurs d'une phase existante, pour préremplir le formulaire de modification. */
export function phaseValuesFromPhase(phase: Phase): PhaseFormValues {
  return {
    name: phase.name,
    estimatedHours: phase.estimatedHours,
    notes: phase.notes ?? '',
  };
}

/** Contrôle fait avant l'appel à l'API. */
export function validatePhaseValues(values: PhaseFormValues) {
  const fieldErrors: PhaseFormState['fieldErrors'] = {};

  if (values.name === '' || values.name.length > 100) {
    fieldErrors.name = PHASE_FIELD_MESSAGES.name;
  }
  if (values.estimatedHours !== '' && !isValidHours(values.estimatedHours)) {
    fieldErrors.estimatedHours = PHASE_FIELD_MESSAGES.estimatedHours;
  }
  if (values.notes.length > 1000) {
    fieldErrors.notes = PHASE_FIELD_MESSAGES.notes;
  }
  return fieldErrors;
}

export function phaseFieldErrorsFromApi(details?: ApiErrorDetail[]) {
  return fieldErrorsFromDetails(PHASE_FIELDS, PHASE_FIELD_MESSAGES, details);
}
