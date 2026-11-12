import { fieldErrorsFromDetails } from './form-errors';
import type { ApiErrorDetail } from './errors';
import type { QuoteLine, QuoteLineType } from './quotes';

export const LINE_FIELDS = [
  'type',
  'label',
  'quantity',
  'unit',
  'unitPrice',
  'vatRate',
] as const;

export type LineField = (typeof LINE_FIELDS)[number];

export const LINE_TYPES: QuoteLineType[] = [
  'material',
  'labor',
  'service',
  'other',
];

export type LineFormValues = Record<LineField, string>;

export type LineFormState = {
  message?: string;
  fieldErrors: Partial<Record<LineField, string>>;
  values: LineFormValues;
};

// Une ligne neuve : un matériau, en quantité 1, avec la TVA à 20 %.
export const DEFAULT_LINE_VALUES: LineFormValues = {
  type: 'material',
  label: '',
  quantity: '1',
  unit: '',
  unitPrice: '',
  vatRate: '20',
};

export const LINE_FIELD_MESSAGES: Record<LineField, string> = {
  type: 'Choisissez un type de ligne.',
  label: 'La désignation est obligatoire (200 caractères au plus).',
  quantity:
    'Quantité invalide : un nombre supérieur à 0, avec 2 décimales au plus.',
  unit: 'L’unité est obligatoire (20 caractères au plus).',
  unitPrice:
    'Prix invalide : un montant positif ou nul, avec 2 décimales au plus.',
  vatRate:
    'Taux de TVA invalide : un nombre de 0 à 99,99, avec 2 décimales au plus.',
};

export function lineInitialState(
  values: LineFormValues = DEFAULT_LINE_VALUES
): LineFormState {
  return { fieldErrors: {}, values };
}

function text(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** "12,5" devient "12.5" : un navigateur ou un clavier peut envoyer la virgule française. */
export function normalizeDecimal(value: string) {
  return value.trim().replace(',', '.');
}

/** Lit le formulaire : textes sans espaces autour, nombres écrits avec un point. */
export function lineValuesFromFormData(formData: FormData): LineFormValues {
  return {
    type: text(formData, 'type'),
    label: text(formData, 'label'),
    quantity: normalizeDecimal(text(formData, 'quantity')),
    unit: text(formData, 'unit'),
    unitPrice: normalizeDecimal(text(formData, 'unitPrice')),
    vatRate: normalizeDecimal(text(formData, 'vatRate')),
  };
}

/** Valeurs d'une ligne existante, pour préremplir le formulaire de modification. */
export function lineValuesFromLine(line: QuoteLine): LineFormValues {
  return {
    type: line.type,
    label: line.label,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    vatRate: line.vatRate,
  };
}

/**
 * Corps envoyé à l'API. Les nombres restent des chaînes décimales ("2.50") : ils ne
 * passent pas par un nombre à virgule flottante, qui ne représente pas exactement 0,1.
 */
export function toLinePayload(values: LineFormValues) {
  return {
    type: values.type,
    label: values.label,
    quantity: values.quantity,
    unit: values.unit,
    unitPrice: values.unitPrice,
    vatRate: values.vatRate,
  };
}

// Colonnes de la base : quantité et prix à 8 chiffres avant la virgule, TVA à 2.
const DECIMAL_8 = /^\d{1,8}(\.\d{1,2})?$/;
const DECIMAL_2 = /^\d{1,2}(\.\d{1,2})?$/;

/** Contrôle fait avant l'appel à l'API : les erreurs les plus courantes, en français. */
export function validateLineValues(values: LineFormValues) {
  const fieldErrors: LineFormState['fieldErrors'] = {};

  if (!LINE_TYPES.some((type) => type === values.type)) {
    fieldErrors.type = LINE_FIELD_MESSAGES.type;
  }
  if (values.label === '' || values.label.length > 200) {
    fieldErrors.label = LINE_FIELD_MESSAGES.label;
  }
  if (!DECIMAL_8.test(values.quantity) || Number(values.quantity) <= 0) {
    fieldErrors.quantity = LINE_FIELD_MESSAGES.quantity;
  }
  if (values.unit === '' || values.unit.length > 20) {
    fieldErrors.unit = LINE_FIELD_MESSAGES.unit;
  }
  if (!DECIMAL_8.test(values.unitPrice)) {
    fieldErrors.unitPrice = LINE_FIELD_MESSAGES.unitPrice;
  }
  if (!DECIMAL_2.test(values.vatRate)) {
    fieldErrors.vatRate = LINE_FIELD_MESSAGES.vatRate;
  }
  return fieldErrors;
}

export function lineFieldErrorsFromApi(details?: ApiErrorDetail[]) {
  return fieldErrorsFromDetails(LINE_FIELDS, LINE_FIELD_MESSAGES, details);
}
