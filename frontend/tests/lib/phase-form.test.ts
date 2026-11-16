import { describe, expect, it } from 'vitest';
import {
  PHASE_FIELD_MESSAGES,
  phaseFieldErrorsFromApi,
  phaseValuesFromFormData,
  toCreatePhasePayload,
  validatePhaseValues,
} from '@/lib/phase-form';

const VALID = { name: 'Ponçage', estimatedHours: '', notes: '' };

describe('phaseValuesFromFormData', () => {
  it('lit les champs sans espaces autour, avec un point pour les heures', () => {
    const data = new FormData();
    data.set('name', '  Ponçage ');
    data.set('estimatedHours', '7,5');

    expect(phaseValuesFromFormData(data)).toEqual({
      name: 'Ponçage',
      estimatedHours: '7.5',
      notes: '',
    });
  });
});

describe('toCreatePhasePayload', () => {
  it('omet l’estimation et les notes vides', () => {
    expect(toCreatePhasePayload(VALID)).toEqual({ name: 'Ponçage' });
  });

  it('garde les heures en chaîne décimale', () => {
    expect(
      toCreatePhasePayload({
        name: 'Ponçage',
        estimatedHours: '7.50',
        notes: 'Grain fin',
      })
    ).toEqual({ name: 'Ponçage', estimatedHours: '7.50', notes: 'Grain fin' });
  });
});

describe('validatePhaseValues', () => {
  it('accepte une phase avec ou sans estimation', () => {
    expect(validatePhaseValues(VALID)).toEqual({});
    expect(
      validatePhaseValues({ ...VALID, estimatedHours: '9999.99' })
    ).toEqual({});
    expect(validatePhaseValues({ ...VALID, estimatedHours: '0' })).toEqual({});
  });

  it('refuse un nom vide ou trop long', () => {
    expect(validatePhaseValues({ ...VALID, name: '' }).name).toBe(
      PHASE_FIELD_MESSAGES.name
    );
    expect(validatePhaseValues({ ...VALID, name: 'a'.repeat(101) }).name).toBe(
      PHASE_FIELD_MESSAGES.name
    );
    expect(validatePhaseValues({ ...VALID, name: 'a'.repeat(100) })).toEqual(
      {}
    );
  });

  it.each(['-1', '10000', '1.234', 'abc', '1e3', '.5'])(
    'refuse %s comme nombre d’heures',
    (hours) => {
      expect(
        validatePhaseValues({ ...VALID, estimatedHours: hours }).estimatedHours
      ).toBe(PHASE_FIELD_MESSAGES.estimatedHours);
    }
  );

  it('refuse des notes trop longues', () => {
    expect(
      validatePhaseValues({ ...VALID, notes: 'a'.repeat(1001) }).notes
    ).toBe(PHASE_FIELD_MESSAGES.notes);
  });
});

describe('phaseFieldErrorsFromApi', () => {
  it('traduit les champs connus et ignore les autres', () => {
    expect(
      phaseFieldErrorsFromApi([
        { path: 'estimatedHours', message: 'x' },
        { path: 'assigneeId', message: 'ignoré' },
      ])
    ).toEqual({ estimatedHours: PHASE_FIELD_MESSAGES.estimatedHours });
    expect(phaseFieldErrorsFromApi()).toEqual({});
  });
});
