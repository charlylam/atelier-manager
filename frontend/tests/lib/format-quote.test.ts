import { describe, expect, it } from 'vitest';
import { formatPercent, formatQuantity } from '@/lib/format';

describe('formatQuantity', () => {
  it('retire les zéros inutiles', () => {
    expect(formatQuantity('6.00')).toBe('6');
    expect(formatQuantity('1.50')).toBe('1,5');
    expect(formatQuantity('2.25')).toBe('2,25');
  });
});

describe('formatPercent', () => {
  it('écrit un taux de TVA à la française', () => {
    expect(formatPercent('20.00')).toMatch(/^20\s%$/);
    expect(formatPercent('5.50')).toMatch(/^5,5\s%$/);
  });
});
