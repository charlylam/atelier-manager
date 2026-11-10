import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionPhase,
  canTransitionWorksite,
} from '../src/lib/worksite-status.js';

describe('Transitions de statut des chantiers', () => {
  it('un chantier en attente peut démarrer ou être annulé', () => {
    assert.equal(canTransitionWorksite('pending', 'in_production'), true);
    assert.equal(canTransitionWorksite('pending', 'canceled'), true);
    assert.equal(canTransitionWorksite('pending', 'ready'), false);
    assert.equal(canTransitionWorksite('pending', 'delivered'), false);
  });

  it('le cycle normal enchaîne démarrage, fin de fabrication et livraison', () => {
    assert.equal(canTransitionWorksite('in_production', 'ready'), true);
    assert.equal(canTransitionWorksite('ready', 'delivered'), true);
    assert.equal(canTransitionWorksite('in_production', 'delivered'), false);
    assert.equal(canTransitionWorksite('ready', 'in_production'), false);
  });

  it('les états finaux n’ont aucune sortie', () => {
    for (const from of ['delivered', 'canceled'] as const) {
      for (const to of [
        'pending',
        'in_production',
        'ready',
        'delivered',
        'canceled',
      ] as const) {
        assert.equal(
          canTransitionWorksite(from, to),
          false,
          `${from} -> ${to}`
        );
      }
    }
  });
});

describe('Transitions de statut des phases', () => {
  it('une phase suit à faire, en cours, terminée', () => {
    assert.equal(canTransitionPhase('todo', 'in_progress'), true);
    assert.equal(canTransitionPhase('in_progress', 'done'), true);
    assert.equal(canTransitionPhase('in_progress', 'todo'), true);
    assert.equal(canTransitionPhase('todo', 'done'), false);
  });

  it('une phase terminée peut être rouverte, pas remise à faire', () => {
    assert.equal(canTransitionPhase('done', 'in_progress'), true);
    assert.equal(canTransitionPhase('done', 'todo'), false);
  });
});
