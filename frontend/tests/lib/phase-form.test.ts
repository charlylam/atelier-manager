import { describe, expect, it } from 'vitest';
import {
  EMPTY_PHASE_VALUES,
  PHASE_FIELD_MESSAGES,
  isValidHours,
  phaseFieldErrorsFromApi,
  phaseValuesFromPhase,
  phaseValuesKey,
  toUpdatePhasePayload,
  phaseValuesFromFormData,
  toCreatePhasePayload,
  validatePhaseValues,
} from '@/lib/phase-form';
import type { Phase } from '@/lib/worksites';

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

describe('toUpdatePhasePayload', () => {
  it('envoie null pour des notes vidées, et jamais le statut ni le temps réel', () => {
    expect(
      toUpdatePhasePayload({
        name: 'Ponçage',
        estimatedHours: '7.5',
        notes: '',
      })
    ).toEqual({ name: 'Ponçage', estimatedHours: '7.5', notes: null });
  });

  it('compte une estimation vidée pour 0 heure', () => {
    expect(
      toUpdatePhasePayload({ name: 'Ponçage', estimatedHours: '', notes: 'x' })
    ).toEqual({ name: 'Ponçage', estimatedHours: '0', notes: 'x' });
  });
});

describe('phaseValuesFromPhase', () => {
  it('préremplit depuis une phase, avec un texte vide pour des notes nulles', () => {
    const phase = {
      name: 'Usinage',
      estimatedHours: '12.50',
      notes: null,
    } as Phase;

    expect(phaseValuesFromPhase(phase)).toEqual({
      name: 'Usinage',
      estimatedHours: '12.50',
      notes: '',
    });
    expect(phaseValuesFromPhase({ ...phase, notes: 'Gabarit' }).notes).toBe(
      'Gabarit'
    );
  });
});

describe('isValidHours', () => {
  it.each(['0', '8', '7.5', '7.50', '9999.99'])('accepte %s', (hours) => {
    expect(isValidHours(hours)).toBe(true);
  });

  it.each(['', '-1', '10000', '1.234', 'abc', '.5', '1,5'])(
    'refuse %s',
    (hours) => {
      expect(isValidHours(hours)).toBe(false);
    }
  );
});

describe('phaseValuesKey', () => {
  it('est identique pour des valeurs identiques, quel que soit l’ordre des propriétés', () => {
    const reordered = { notes: '', estimatedHours: '', name: 'Ponçage' };

    expect(phaseValuesKey(VALID)).toBe(phaseValuesKey({ ...VALID }));
    expect(phaseValuesKey(VALID)).toBe(phaseValuesKey(reordered));
  });

  it('est identique à chaque appel avec les valeurs par défaut de l’ajout', () => {
    expect(phaseValuesKey(EMPTY_PHASE_VALUES)).toBe(
      phaseValuesKey({ ...EMPTY_PHASE_VALUES })
    );
  });

  it.each([
    ['name', 'Autre nom'],
    ['estimatedHours', '7.5'],
    ['notes', 'Autres notes'],
  ] as const)('change quand %s change', (field, value) => {
    expect(phaseValuesKey({ ...VALID, [field]: value })).not.toBe(
      phaseValuesKey(VALID)
    );
  });

  it('ne confond pas deux répartitions différentes du même texte entre les champs', () => {
    expect(phaseValuesKey({ ...VALID, name: 'a', notes: 'b' })).not.toBe(
      phaseValuesKey({ ...VALID, name: 'ab', notes: '' })
    );
  });
});
