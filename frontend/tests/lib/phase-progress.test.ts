import { describe, expect, it } from 'vitest';
import {
  PROGRESS_LOCKED_MESSAGE,
  phaseStatusChangesFor,
  phaseStatusConflictMessage,
} from '@/lib/phase-progress';

const targets = (status: Parameters<typeof phaseStatusChangesFor>[0]) =>
  phaseStatusChangesFor(status).map((change) => change.target);

describe('phaseStatusChangesFor', () => {
  it('propose les transitions de l’API pour chaque statut', () => {
    expect(targets('todo')).toEqual(['in_progress']);
    expect(targets('in_progress')).toEqual(['done', 'todo']);
    expect(targets('done')).toEqual(['in_progress']);
  });

  it('ne propose jamais de passer directement de « terminée » à « à faire »', () => {
    expect(targets('done')).not.toContain('todo');
  });

  it('donne un libellé à chaque changement', () => {
    expect(phaseStatusChangesFor('todo')[0].label).toBe('Démarrer');
    expect(phaseStatusChangesFor('in_progress').map((c) => c.label)).toEqual([
      'Terminer',
      'Remettre à faire',
    ]);
    expect(phaseStatusChangesFor('done')[0].label).toBe('Rouvrir');
  });
});

describe('phaseStatusConflictMessage', () => {
  it('traduit un changement de statut devenu impossible', () => {
    expect(
      phaseStatusConflictMessage('Cannot change phase status from done to todo')
    ).toBe(
      'Le statut de cette phase a changé entre-temps. Rechargez la page pour voir la situation actuelle.'
    );
  });

  it('traduit le refus d’avancement hors fabrication', () => {
    expect(
      phaseStatusConflictMessage(
        'Phase progress can only be changed while the worksite is in production'
      )
    ).toBe(PROGRESS_LOCKED_MESSAGE);
  });
});
