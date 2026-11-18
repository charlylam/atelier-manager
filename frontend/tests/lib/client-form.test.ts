import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUES,
  FIELD_MESSAGES,
  clientValuesKey,
  fieldErrorsFromApi,
  toCreatePayload,
  toUpdatePayload,
  validateClientValues,
  valuesFromClient,
  valuesFromFormData,
} from '@/lib/client-form';
import type { Client } from '@/lib/clients';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe('valuesFromFormData', () => {
  it('retire les espaces autour des textes', () => {
    const values = valuesFromFormData(
      form({ name: '  Famille Durand ', email: ' a@b.fr ', isCompany: 'false' })
    );

    expect(values.name).toBe('Famille Durand');
    expect(values.email).toBe('a@b.fr');
  });

  it('lit le type de client, « particulier » par défaut', () => {
    expect(valuesFromFormData(form({ isCompany: 'true' })).isCompany).toBe(
      'true'
    );
    expect(valuesFromFormData(form({})).isCompany).toBe('false');
    expect(
      valuesFromFormData(form({ isCompany: 'n’importe quoi' })).isCompany
    ).toBe('false');
  });

  it('renvoie des textes vides pour les champs absents', () => {
    expect(valuesFromFormData(form({ name: 'X' }))).toEqual({
      ...EMPTY_VALUES,
      name: 'X',
    });
  });
});

describe('valuesFromClient', () => {
  it('remplace les valeurs absentes par des textes vides', () => {
    const client = {
      id: 1,
      code: 'CLI-0001',
      name: 'Menuiserie Dubois',
      isCompany: true,
      email: null,
      phone: '04 74 00 00 00',
      address: null,
      notes: null,
      createdAt: '',
    } satisfies Client;

    expect(valuesFromClient(client)).toEqual({
      name: 'Menuiserie Dubois',
      isCompany: 'true',
      email: '',
      phone: '04 74 00 00 00',
      address: '',
      notes: '',
    });
  });
});

describe('toCreatePayload', () => {
  it('omet les champs facultatifs vides', () => {
    expect(toCreatePayload({ ...EMPTY_VALUES, name: 'Durand' })).toEqual({
      name: 'Durand',
      isCompany: false,
    });
  });

  it('garde les champs renseignés', () => {
    expect(
      toCreatePayload({
        ...EMPTY_VALUES,
        name: 'Dubois',
        isCompany: 'true',
        email: 'a@b.fr',
        notes: 'n',
      })
    ).toEqual({
      name: 'Dubois',
      isCompany: true,
      email: 'a@b.fr',
      notes: 'n',
    });
  });
});

describe('toUpdatePayload', () => {
  it('envoie null pour un champ facultatif vidé, afin de l’effacer', () => {
    expect(
      toUpdatePayload({ ...EMPTY_VALUES, name: 'Durand', phone: '06' })
    ).toEqual({
      name: 'Durand',
      isCompany: false,
      email: null,
      phone: '06',
      address: null,
      notes: null,
    });
  });
});

describe('validateClientValues', () => {
  it('exige un nom', () => {
    expect(validateClientValues(EMPTY_VALUES)).toEqual({
      name: FIELD_MESSAGES.name,
    });
    expect(validateClientValues({ ...EMPTY_VALUES, name: 'Durand' })).toEqual(
      {}
    );
  });
});

describe('fieldErrorsFromApi', () => {
  it('traduit les champs refusés par l’API avec nos messages', () => {
    expect(
      fieldErrorsFromApi([
        { path: 'email', message: 'Invalid email address' },
        { path: 'phone', message: 'Too big' },
      ])
    ).toEqual({ email: FIELD_MESSAGES.email, phone: FIELD_MESSAGES.phone });
  });

  it('ignore les champs inconnus et l’absence de détail', () => {
    expect(fieldErrorsFromApi([{ path: 'inconnu', message: 'x' }])).toEqual({});
    expect(fieldErrorsFromApi(undefined)).toEqual({});
  });
});

describe('clientValuesKey', () => {
  const VALUES = {
    ...EMPTY_VALUES,
    name: 'Famille Durand',
    email: 'durand@example.test',
  };

  it('est identique pour des valeurs identiques, quel que soit l’ordre des propriétés', () => {
    const reordered = {
      notes: '',
      address: '',
      phone: '',
      email: 'durand@example.test',
      isCompany: 'false' as const,
      name: 'Famille Durand',
    };

    expect(clientValuesKey(VALUES)).toBe(clientValuesKey({ ...VALUES }));
    expect(clientValuesKey(VALUES)).toBe(clientValuesKey(reordered));
  });

  it.each([
    ['name', 'Autre nom'],
    ['isCompany', 'true'],
    ['email', 'autre@example.test'],
    ['phone', '06'],
    ['address', 'autre adresse'],
    ['notes', 'autres notes'],
  ] as const)('change quand %s change', (field, value) => {
    expect(clientValuesKey({ ...VALUES, [field]: value })).not.toBe(
      clientValuesKey(VALUES)
    );
  });

  it('ne confond pas deux répartitions différentes du même texte entre les champs', () => {
    expect(clientValuesKey({ ...VALUES, name: 'a', email: 'b' })).not.toBe(
      clientValuesKey({ ...VALUES, name: 'ab', email: '' })
    );
  });
});
