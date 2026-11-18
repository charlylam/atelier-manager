import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LINE_VALUES,
  LINE_FIELD_MESSAGES,
  lineFieldErrorsFromApi,
  lineValuesFromFormData,
  lineValuesFromLine,
  lineValuesKey,
  normalizeDecimal,
  toLinePayload,
  validateLineValues,
} from '@/lib/line-form';
import type { QuoteLine } from '@/lib/quotes';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

const VALID = {
  type: 'material',
  label: 'Chêne massif',
  quantity: '6',
  unit: 'm²',
  unitPrice: '180',
  vatRate: '20',
};

describe('normalizeDecimal', () => {
  it('remplace la virgule française par un point', () => {
    expect(normalizeDecimal(' 12,5 ')).toBe('12.5');
    expect(normalizeDecimal('12.5')).toBe('12.5');
  });
});

describe('lineValuesFromFormData', () => {
  it('retire les espaces, écrit les nombres avec un point', () => {
    expect(
      lineValuesFromFormData(
        form({
          type: 'labor',
          label: '  Pose ',
          quantity: '2,5',
          unit: ' h ',
          unitPrice: '45,50',
          vatRate: '20',
        })
      )
    ).toEqual({
      type: 'labor',
      label: 'Pose',
      quantity: '2.5',
      unit: 'h',
      unitPrice: '45.50',
      vatRate: '20',
    });
  });
});

describe('lineValuesFromLine', () => {
  it('reprend les valeurs d’une ligne existante pour préremplir le formulaire', () => {
    const line = {
      id: 1,
      position: 1,
      type: 'material',
      label: 'Chêne',
      quantity: '6.00',
      unit: 'm²',
      unitPrice: '180.00',
      vatRate: '20.00',
      totalExclTax: '1080.00',
    } satisfies QuoteLine;

    expect(lineValuesFromLine(line)).toEqual({
      type: 'material',
      label: 'Chêne',
      quantity: '6.00',
      unit: 'm²',
      unitPrice: '180.00',
      vatRate: '20.00',
    });
  });
});

describe('toLinePayload', () => {
  it('garde les nombres sous forme de chaînes décimales, sans passer par un flottant', () => {
    const payload = toLinePayload({
      ...VALID,
      quantity: '0.10',
      unitPrice: '12.30',
    });

    expect(payload.quantity).toBe('0.10');
    expect(payload.unitPrice).toBe('12.30');
    expect(typeof payload.quantity).toBe('string');
  });
});

describe('validateLineValues', () => {
  it('accepte une ligne complète, un prix nul et une TVA nulle', () => {
    expect(validateLineValues(VALID)).toEqual({});
    expect(
      validateLineValues({ ...VALID, unitPrice: '0', vatRate: '0' })
    ).toEqual({});
    expect(
      validateLineValues({
        ...VALID,
        quantity: '2.25',
        unitPrice: '12.5',
        vatRate: '5.5',
      })
    ).toEqual({});
  });

  it('refuse la ligne vide de départ : il manque la désignation, l’unité et le prix', () => {
    expect(validateLineValues(DEFAULT_LINE_VALUES)).toEqual({
      label: LINE_FIELD_MESSAGES.label,
      unit: LINE_FIELD_MESSAGES.unit,
      unitPrice: LINE_FIELD_MESSAGES.unitPrice,
    });
  });

  it('refuse une quantité nulle, négative, à trois décimales ou non numérique', () => {
    for (const quantity of ['0', '-1', '1.234', 'abc', '']) {
      expect(
        validateLineValues({ ...VALID, quantity }).quantity,
        quantity
      ).toBe(LINE_FIELD_MESSAGES.quantity);
    }
  });

  it('refuse un prix à trois décimales ou négatif', () => {
    for (const unitPrice of ['12.345', '-1', 'abc']) {
      expect(
        validateLineValues({ ...VALID, unitPrice }).unitPrice,
        unitPrice
      ).toBe(LINE_FIELD_MESSAGES.unitPrice);
    }
  });

  it('refuse un taux de TVA de 100 % ou plus, ou négatif', () => {
    for (const vatRate of ['100', '-5', '20.555']) {
      expect(validateLineValues({ ...VALID, vatRate }).vatRate, vatRate).toBe(
        LINE_FIELD_MESSAGES.vatRate
      );
    }
  });

  it('refuse un type inconnu, une désignation ou une unité trop longues', () => {
    expect(
      validateLineValues({
        ...VALID,
        type: 'autre',
        label: 'a'.repeat(201),
        unit: 'a'.repeat(21),
      })
    ).toEqual({
      type: LINE_FIELD_MESSAGES.type,
      label: LINE_FIELD_MESSAGES.label,
      unit: LINE_FIELD_MESSAGES.unit,
    });
  });
});

describe('lineFieldErrorsFromApi', () => {
  it('traduit les champs refusés par l’API', () => {
    expect(
      lineFieldErrorsFromApi([{ path: 'unitPrice', message: 'Invalid' }])
    ).toEqual({
      unitPrice: LINE_FIELD_MESSAGES.unitPrice,
    });
  });
});

describe('lineValuesKey', () => {
  it('est identique pour des valeurs identiques, quel que soit l’ordre des propriétés', () => {
    const reordered = {
      vatRate: '20',
      unitPrice: '180',
      unit: 'm²',
      quantity: '6',
      label: 'Chêne massif',
      type: 'material',
    };

    expect(lineValuesKey(VALID)).toBe(lineValuesKey({ ...VALID }));
    expect(lineValuesKey(VALID)).toBe(lineValuesKey(reordered));
  });

  it('est identique à chaque appel avec les valeurs par défaut de l’ajout', () => {
    expect(lineValuesKey(DEFAULT_LINE_VALUES)).toBe(
      lineValuesKey({ ...DEFAULT_LINE_VALUES })
    );
  });

  it.each([
    ['type', 'labor'],
    ['label', 'Autre désignation'],
    ['quantity', '7'],
    ['unit', 'h'],
    ['unitPrice', '181'],
    ['vatRate', '10'],
  ] as const)('change quand %s change', (field, value) => {
    expect(lineValuesKey({ ...VALID, [field]: value })).not.toBe(
      lineValuesKey(VALID)
    );
  });

  it('ne confond pas deux répartitions différentes du même texte entre les champs', () => {
    expect(lineValuesKey({ ...VALID, label: 'a', unit: 'b' })).not.toBe(
      lineValuesKey({ ...VALID, label: 'ab', unit: '' })
    );
  });
});
