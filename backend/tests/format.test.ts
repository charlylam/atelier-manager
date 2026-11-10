import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateFr,
  formatMoney,
  formatQuantity,
} from '../src/lib/format.js';

describe('Mise en forme française', () => {
  it('formate les montants avec séparateur de milliers et virgule', () => {
    assert.equal(formatMoney('1080.00'), '1 080,00 €');
    assert.equal(formatMoney('0.00'), '0,00 €');
    assert.equal(formatMoney('1234567.89'), '1 234 567,89 €');
  });

  it('supprime les zéros inutiles des quantités', () => {
    assert.equal(formatQuantity('6.00'), '6');
    assert.equal(formatQuantity('1.50'), '1,5');
    assert.equal(formatQuantity('10.00'), '10');
    assert.equal(formatQuantity('0.25'), '0,25');
  });

  it('formate les dates en JJ/MM/AAAA', () => {
    assert.equal(
      formatDateFr(new Date('2026-11-09T00:00:00.000Z')),
      '09/11/2026'
    );
    assert.equal(formatDateFr('2026-12-31'), '31/12/2026');
  });
});
