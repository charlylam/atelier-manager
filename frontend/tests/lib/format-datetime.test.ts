import { describe, expect, it } from 'vitest';
import { formatDate } from '@/lib/format';

describe('formatDate avec une date-heure ISO', () => {
  it('lit la date des dix premiers caractères (forme renvoyée par la fiche client)', () => {
    expect(formatDate('2026-12-31T00:00:00.000Z')).toBe('31/12/2026');
  });
});
