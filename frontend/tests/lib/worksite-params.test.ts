import { describe, expect, it } from 'vitest';
import { parseWorksiteStatus } from '@/lib/worksite-params';

describe('parseWorksiteStatus', () => {
  it('accepte les cinq statuts de l’API', () => {
    for (const status of [
      'pending',
      'in_production',
      'ready',
      'delivered',
      'canceled',
    ]) {
      expect(parseWorksiteStatus(status)).toBe(status);
    }
  });

  it('ignore toute autre valeur, sans appeler l’API avec', () => {
    for (const value of [
      undefined,
      '',
      'READY',
      'prêt',
      'ready;drop',
      'draft',
    ]) {
      expect(parseWorksiteStatus(value), String(value)).toBeUndefined();
    }
  });
});
