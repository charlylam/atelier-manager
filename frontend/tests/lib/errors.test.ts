import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/errors';

describe('ApiError', () => {
  it('porte le statut HTTP et le code applicatif de l’API', () => {
    const error = new ApiError('Mot de passe faux', 401, 'UNAUTHORIZED');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Mot de passe faux');
    expect(error.status).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });
});
