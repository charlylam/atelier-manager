import { describe, expect, it } from 'vitest';
import { formatMonth, parseMonth, shiftMonth } from '@/lib/months';

describe('parseMonth', () => {
  it('accepte un mois valide', () => {
    expect(parseMonth('2026-09')).toBe('2026-09');
    expect(parseMonth('2026-12')).toBe('2026-12');
  });

  it('ignore une valeur absente ou invalide, sans appeler l’API avec', () => {
    for (const value of [
      undefined,
      '',
      '2026-13',
      '2026-00',
      '2026-9',
      'septembre',
      '1999-05',
      '2026-09-01',
    ]) {
      expect(parseMonth(value), String(value)).toBeUndefined();
    }
  });
});

describe('shiftMonth', () => {
  it('avance et recule d’un mois', () => {
    expect(shiftMonth('2026-09', 1)).toBe('2026-10');
    expect(shiftMonth('2026-09', -1)).toBe('2026-08');
  });

  it('change d’année après décembre et avant janvier', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

describe('formatMonth', () => {
  it('écrit le mois en français', () => {
    expect(formatMonth('2026-09')).toBe('septembre 2026');
    expect(formatMonth('2027-01')).toBe('janvier 2027');
  });
});
