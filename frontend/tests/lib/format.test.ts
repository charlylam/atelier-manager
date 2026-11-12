import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from '@/lib/format';

// Intl insère des espaces insécables : on les remplace par des espaces simples pour comparer.
const plain = (text: string) => text.replace(/[\u202f\u00a0]/g, ' ');

describe('formatMoney', () => {
  it('formate un montant en euros, à la française', () => {
    expect(plain(formatMoney('2412.00'))).toBe('2 412,00 €');
    expect(plain(formatMoney('1505.50'))).toBe('1 505,50 €');
    expect(plain(formatMoney('0.00'))).toBe('0,00 €');
  });
});

describe('formatDate', () => {
  it('écrit une date AAAA-MM-JJ en JJ/MM/AAAA', () => {
    expect(formatDate('2026-12-15')).toBe('15/12/2026');
  });
});
