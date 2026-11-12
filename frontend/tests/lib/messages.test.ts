import { describe, expect, it } from 'vitest';
import { messageForCode } from '@/lib/messages';

describe('messageForCode', () => {
  it('traduit les codes d’erreur connus de l’API', () => {
    expect(messageForCode('UNAUTHORIZED')).toBe(
      'E-mail ou mot de passe incorrect.'
    );
    expect(messageForCode('TOO_MANY_REQUESTS')).toContain('Trop de tentatives');
    expect(messageForCode('CONFLICT')).toContain('déjà utilisé');
  });

  it('renvoie un message générique pour un code inconnu ou absent', () => {
    expect(messageForCode('QUELQUE_CHOSE')).toBe(
      'Une erreur est survenue. Réessayez.'
    );
    expect(messageForCode(undefined)).toBe(
      'Une erreur est survenue. Réessayez.'
    );
  });
});
