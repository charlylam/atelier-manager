import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLine, computeTotals } from '../src/lib/quote-totals.js';
import { canTransition } from '../src/lib/quote-status.js';

describe('Calcul des montants', () => {
  it('calcule une ligne : 6 × 180 € à 20 %', () => {
    const line = computeLine({ quantity: 6, unitPrice: 180, vatRate: 20 });

    assert.equal(line.totalExclTax.toFixed(2), '1080.00');
    assert.equal(line.vat.toFixed(2), '216.00');
    assert.equal(line.totalInclTax.toFixed(2), '1296.00');
  });

  it('arrondit la TVA au demi supérieur (0,025 → 0,03)', () => {
    const line = computeLine({ quantity: 1, unitPrice: '0.25', vatRate: 10 });

    assert.equal(line.vat.toFixed(2), '0.03');
  });

  it('calcule la TVA par ligne, pas sur le total', () => {
    const lines = [
      { quantity: 1, unitPrice: '0.25', vatRate: 10 },
      { quantity: 1, unitPrice: '0.25', vatRate: 10 },
    ];

    // Par ligne : 0,03 + 0,03. Sur le total (0,50 × 10 %), on aurait 0,05.
    assert.equal(computeTotals(lines).totalVat, '0.06');
  });

  it('gère les quantités décimales (1,5 h × 45 €)', () => {
    const line = computeLine({ quantity: '1.5', unitPrice: 45, vatRate: 20 });

    assert.equal(line.totalExclTax.toFixed(2), '67.50');
  });

  it('renvoie des totaux à zéro pour un devis sans ligne', () => {
    assert.deepEqual(computeTotals([]), {
      totalExclTax: '0.00',
      totalVat: '0.00',
      totalInclTax: '0.00',
    });
  });
});

describe('Transitions de statut des devis', () => {
  it('un brouillon ne peut qu’être envoyé', () => {
    assert.equal(canTransition('draft', 'sent'), true);
    assert.equal(canTransition('draft', 'accepted'), false);
    assert.equal(canTransition('draft', 'rejected'), false);
    assert.equal(canTransition('draft', 'expired'), false);
  });

  it('un devis envoyé peut être accepté, refusé ou expirer', () => {
    assert.equal(canTransition('sent', 'accepted'), true);
    assert.equal(canTransition('sent', 'rejected'), true);
    assert.equal(canTransition('sent', 'expired'), true);
    assert.equal(canTransition('sent', 'draft'), false);
  });

  it('les états finaux n’ont aucune sortie', () => {
    for (const from of ['accepted', 'rejected', 'expired'] as const) {
      for (const to of [
        'draft',
        'sent',
        'accepted',
        'rejected',
        'expired',
      ] as const) {
        assert.equal(canTransition(from, to), false, `${from} -> ${to}`);
      }
    }
  });
});
