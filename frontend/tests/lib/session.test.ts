import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import {
  clearSessionCookie,
  setSessionCookie,
  startSession,
} from '@/lib/session';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
});

describe('cookie de session', () => {
  it('est httpOnly, sameSite strict et valable un jour', async () => {
    await setSessionCookie('jeton-123');

    expect(cookieStore.set).toHaveBeenCalledWith({
      name: 'token',
      value: 'jeton-123',
      httpOnly: true,
      path: '/',
      secure: false, // NODE_ENV n'est pas "production" en test
      sameSite: 'strict',
      maxAge: 86400,
    });
  });

  it('n’est envoyé qu’en HTTPS en production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await setSessionCookie('jeton-123');
    vi.unstubAllEnvs();

    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true })
    );
  });

  it('est supprimé à la déconnexion', async () => {
    await clearSessionCookie();
    expect(cookieStore.delete).toHaveBeenCalledWith('token');
  });
});

describe('startSession', () => {
  it('pose le cookie avec le jeton de l’API et ne renvoie que l’utilisateur', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'jeton-123',
          user: { id: 1, firstName: 'Pierre' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const user = await startSession({ email: 'a@b.fr', password: 'Demo2026!' });

    expect(user).toEqual({ id: 1, firstName: 'Pierre' });
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'jeton-123' })
    );
  });

  it('refuse une réponse de connexion sans jeton', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(
      startSession({ email: 'a@b.fr', password: 'Demo2026!' })
    ).rejects.toMatchObject({ status: 502, code: 'INVALID_RESPONSE' });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
