import { describe, expect, it } from 'vitest';
import {
  WORKSITE_FIELD_MESSAGES,
  toUpdateWorksitePayload,
  validateWorksiteValues,
  worksiteFieldErrorsFromApi,
  worksiteValuesFromFormData,
  worksiteValuesFromWorksite,
} from '@/lib/worksite-form';
import type { Worksite } from '@/lib/worksites';

const VALID = {
  title: 'Bibliothèque',
  description: '',
  siteAddress: '',
  dueDate: '',
};

describe('worksiteValuesFromFormData', () => {
  it('lit les quatre champs sans espaces autour, et vide ceux qui manquent', () => {
    const data = new FormData();
    data.set('title', '  Bibliothèque ');
    data.set('dueDate', '2026-12-15');

    expect(worksiteValuesFromFormData(data)).toEqual({
      title: 'Bibliothèque',
      description: '',
      siteAddress: '',
      dueDate: '2026-12-15',
    });
  });
});

describe('worksiteValuesFromWorksite', () => {
  it('préremplit depuis un chantier, avec des textes vides pour les valeurs nulles', () => {
    const worksite = {
      title: 'Bibliothèque',
      description: null,
      siteAddress: '5 place du Marché',
      dueDate: '2026-12-15',
    } as Worksite;

    expect(worksiteValuesFromWorksite(worksite)).toEqual({
      title: 'Bibliothèque',
      description: '',
      siteAddress: '5 place du Marché',
      dueDate: '2026-12-15',
    });
    expect(
      worksiteValuesFromWorksite({ ...worksite, dueDate: null }).dueDate
    ).toBe('');
  });
});

describe('toUpdateWorksitePayload', () => {
  it('envoie null pour un champ vidé, et les quatre champs à chaque fois', () => {
    expect(toUpdateWorksitePayload(VALID)).toEqual({
      title: 'Bibliothèque',
      description: null,
      siteAddress: null,
      dueDate: null,
    });
  });
});

describe('validateWorksiteValues', () => {
  it('accepte des valeurs valides, y compris une échéance passée', () => {
    expect(validateWorksiteValues(VALID)).toEqual({});
    expect(validateWorksiteValues({ ...VALID, dueDate: '2020-01-01' })).toEqual(
      {}
    );
  });

  it('refuse un titre vide ou trop long', () => {
    expect(validateWorksiteValues({ ...VALID, title: '' }).title).toBe(
      WORKSITE_FIELD_MESSAGES.title
    );
    expect(
      validateWorksiteValues({ ...VALID, title: 'a'.repeat(201) }).title
    ).toBe(WORKSITE_FIELD_MESSAGES.title);
    expect(
      validateWorksiteValues({ ...VALID, title: 'a'.repeat(200) })
    ).toEqual({});
  });

  it('refuse une description ou une adresse trop longue', () => {
    const errors = validateWorksiteValues({
      ...VALID,
      description: 'a'.repeat(2001),
      siteAddress: 'a'.repeat(201),
    });

    expect(errors.description).toBe(WORKSITE_FIELD_MESSAGES.description);
    expect(errors.siteAddress).toBe(WORKSITE_FIELD_MESSAGES.siteAddress);
  });

  it('refuse une date mal formée', () => {
    expect(validateWorksiteValues({ ...VALID, dueDate: '15/12/2026' })).toEqual(
      {
        dueDate: WORKSITE_FIELD_MESSAGES.dueDate,
      }
    );
  });
});

describe('worksiteFieldErrorsFromApi', () => {
  it('traduit les champs connus et ignore les autres', () => {
    expect(
      worksiteFieldErrorsFromApi([
        { path: 'siteAddress', message: 'Too big' },
        { path: 'phases', message: 'x' },
      ])
    ).toEqual({ siteAddress: WORKSITE_FIELD_MESSAGES.siteAddress });
    expect(worksiteFieldErrorsFromApi()).toEqual({});
  });
});
