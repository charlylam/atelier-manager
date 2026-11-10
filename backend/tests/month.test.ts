import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { monthRange } from '../src/lib/month.js';

describe('Bornes d’un mois', () => {
  it('renvoie le premier jour du mois et celui du mois suivant, en UTC', () => {
    const { label, start, end } = monthRange('2026-09');

    assert.equal(label, '2026-09');
    assert.equal(start.toISOString(), '2026-09-01T00:00:00.000Z');
    assert.equal(end.toISOString(), '2026-10-01T00:00:00.000Z');
  });

  it('passe à l’année suivante après décembre', () => {
    const { start, end } = monthRange('2026-12');

    assert.equal(start.toISOString(), '2026-12-01T00:00:00.000Z');
    assert.equal(end.toISOString(), '2027-01-01T00:00:00.000Z');
  });

  it('prend le mois courant par défaut', () => {
    const { label } = monthRange();

    assert.equal(label, new Date().toISOString().slice(0, 7));
  });
});
