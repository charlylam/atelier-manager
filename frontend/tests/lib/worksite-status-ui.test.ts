import { describe, expect, it } from 'vitest';
import {
  WORKSITE_STATUS_CHANGES,
  worksiteStatusChangesFor,
} from '@/lib/worksite-status-ui';
import {
  worksiteConflictMessage,
  worksiteStatusConflictMessage,
} from '@/lib/worksite-ui';

const targets = (status: Parameters<typeof worksiteStatusChangesFor>[0]) =>
  worksiteStatusChangesFor(status).map((change) => change.target);

describe('worksiteStatusChangesFor', () => {
  it('propose les transitions de l’API pour chaque statut', () => {
    expect(targets('pending')).toEqual(['in_production', 'canceled']);
    expect(targets('in_production')).toEqual(['ready', 'canceled']);
    expect(targets('ready')).toEqual(['delivered', 'canceled']);
  });

  it('ne propose rien pour un chantier livré ou annulé', () => {
    expect(targets('delivered')).toEqual([]);
    expect(targets('canceled')).toEqual([]);
  });

  it('associe à chaque statut visé ses trois textes', () => {
    for (const [target, change] of Object.entries(WORKSITE_STATUS_CHANGES)) {
      expect(change.target).toBe(target);
      expect(change.label).not.toBe('');
      expect(change.question).not.toBe('');
      expect(change.confirmLabel).not.toBe('');
    }
  });
});

describe('worksiteStatusConflictMessage', () => {
  const CHANGED =
    'Le statut de ce chantier a changé entre-temps. Rechargez la page pour voir la situation actuelle.';

  it.each([
    [
      'All phases must be done before the worksite is ready',
      'Toutes les phases doivent être terminées avant de marquer le chantier comme prêt à livrer.',
    ],
    ['Worksite status has changed, please reload', CHANGED],
    ['Cannot change worksite status from delivered to ready', CHANGED],
    ['Un autre refus', 'Une erreur est survenue. Réessayez.'],
  ])('traduit « %s »', (apiMessage, expected) => {
    expect(worksiteStatusConflictMessage(apiMessage)).toBe(expected);
  });
});

describe('worksiteConflictMessage', () => {
  it('ne reprend pas les messages du changement de statut', () => {
    expect(
      worksiteConflictMessage(
        'All phases must be done before the worksite is ready'
      )
    ).toBe('Une erreur est survenue. Réessayez.');
  });
});
