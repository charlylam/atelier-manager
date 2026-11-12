import { describe, expect, it } from 'vitest';
import { parseQuoteStatus } from '@/lib/quote-params';

describe('parseQuoteStatus', () => {
  it('accepte les cinq statuts de l’API', () => {
    for (const status of ['draft', 'sent', 'accepted', 'rejected', 'expired']) {
      expect(parseQuoteStatus(status)).toBe(status);
    }
  });

  it('ignore toute autre valeur, sans appeler l’API avec', () => {
    for (const value of [
      undefined,
      '',
      'SENT',
      'envoyé',
      'sent;drop',
      'canceled',
    ]) {
      expect(parseQuoteStatus(value), String(value)).toBeUndefined();
    }
  });
});
