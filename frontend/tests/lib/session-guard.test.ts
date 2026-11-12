import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock('next/navigation', () => nav);

import { ApiError } from '@/lib/errors';
import { orLogin } from '@/lib/session-guard';

beforeEach(() => {
  nav.redirect.mockClear();
});

describe('orLogin', () => {
  it('renvoie le résultat de l’appel quand tout va bien', async () => {
    await expect(orLogin(Promise.resolve({ ok: true }))).resolves.toEqual({
      ok: true,
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand l’API refuse le jeton (401)', async () => {
    const call = Promise.reject(
      new ApiError('Invalid or expired token', 401, 'UNAUTHORIZED')
    );

    await expect(orLogin(call)).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });

  it('relance les autres erreurs, sans rediriger', async () => {
    const call = Promise.reject(new ApiError('Panne', 500, 'INTERNAL_ERROR'));

    await expect(orLogin(call)).rejects.toMatchObject({ status: 500 });
    expect(nav.redirect).not.toHaveBeenCalled();
  });
});
