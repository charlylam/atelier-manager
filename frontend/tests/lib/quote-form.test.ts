import { describe, expect, it } from 'vitest';
import {
  EMPTY_QUOTE_VALUES,
  QUOTE_FIELD_MESSAGES,
  quoteFieldErrorsFromApi,
  quoteValuesFromFormData,
  quoteValuesFromQuote,
  toCreateQuotePayload,
  toUpdateQuotePayload,
  validateQuoteValues,
} from '@/lib/quote-form';
import type { Quote } from '@/lib/quotes';

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

const VALID = {
  clientId: '3',
  title: 'Bibliothèque',
  description: '',
  validUntil: '',
};

describe('quoteValuesFromFormData', () => {
  it('retire les espaces autour des textes et renvoie du texte vide pour les champs absents', () => {
    expect(
      quoteValuesFromFormData(
        form({ clientId: ' 3 ', title: '  Bibliothèque ' })
      )
    ).toEqual({
      clientId: '3',
      title: 'Bibliothèque',
      description: '',
      validUntil: '',
    });
  });
});

describe('quoteValuesFromQuote', () => {
  it('prépare le formulaire de modification, sans valeur absente', () => {
    const quote = {
      title: 'Bibliothèque',
      description: null,
      validUntil: '2026-12-31T00:00:00.000Z',
      client: { id: 3, code: 'CLI-0001', name: 'Famille Durand' },
    } as Quote;

    expect(quoteValuesFromQuote(quote)).toEqual({
      clientId: '3',
      title: 'Bibliothèque',
      description: '',
      validUntil: '2026-12-31',
    });
  });
});

describe('toCreateQuotePayload', () => {
  it('envoie le client en nombre et omet la description et la date vides', () => {
    expect(toCreateQuotePayload(VALID)).toEqual({
      clientId: 3,
      title: 'Bibliothèque',
    });
  });

  it('garde la description et la date renseignées', () => {
    expect(
      toCreateQuotePayload({
        ...VALID,
        description: 'Chêne',
        validUntil: '2026-12-31',
      })
    ).toEqual({
      clientId: 3,
      title: 'Bibliothèque',
      description: 'Chêne',
      validUntil: '2026-12-31',
    });
  });
});

describe('toUpdateQuotePayload', () => {
  it('envoie null pour une description ou une date vidée, afin de l’effacer', () => {
    expect(toUpdateQuotePayload(VALID)).toEqual({
      clientId: 3,
      title: 'Bibliothèque',
      description: null,
      validUntil: null,
    });
  });
});

describe('validateQuoteValues', () => {
  it('accepte un client et un titre', () => {
    expect(validateQuoteValues(VALID)).toEqual({});
  });

  it('exige un client et un titre', () => {
    expect(validateQuoteValues(EMPTY_QUOTE_VALUES)).toEqual({
      clientId: QUOTE_FIELD_MESSAGES.clientId,
      title: QUOTE_FIELD_MESSAGES.title,
    });
  });

  it('refuse un titre ou une description trop longs, et une date mal formée', () => {
    expect(
      validateQuoteValues({
        ...VALID,
        title: 'a'.repeat(201),
        description: 'a'.repeat(2001),
        validUntil: '31/12/2026',
      })
    ).toEqual({
      title: QUOTE_FIELD_MESSAGES.title,
      description: QUOTE_FIELD_MESSAGES.description,
      validUntil: QUOTE_FIELD_MESSAGES.validUntil,
    });
  });
});

describe('quoteFieldErrorsFromApi', () => {
  it('traduit les champs refusés par l’API', () => {
    expect(
      quoteFieldErrorsFromApi([
        { path: 'validUntil', message: 'Date in the past' },
      ])
    ).toEqual({
      validUntil: QUOTE_FIELD_MESSAGES.validUntil,
    });
  });
});
