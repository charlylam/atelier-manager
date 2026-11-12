import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { apiFetch, apiFetchPrivate, getCurrentUserOrNull } from '@/lib/api';
import { ApiError } from '@/lib/errors';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const USER = {
  id: 1,
  firstName: 'Pierre',
  lastName: 'Martin',
  email: 'admin@atelier-martin.test',
  role: 'admin',
  workshop: { id: 1, name: 'Atelier Martin' },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
});

describe('apiFetch', () => {
  it('renvoie le JSON de la réponse', async () => {
    fetchMock.mockResolvedValue(json({ data: { ok: true } }));

    await expect(apiFetch('/api/health')).resolves.toEqual({
      data: { ok: true },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/health',
      undefined
    );
  });

  it('renvoie null pour une réponse 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      apiFetch('/api/clients/1', { method: 'DELETE' })
    ).resolves.toBeNull();
  });

  it('lève une ApiError avec le statut, le code et le message de l’API', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'CONFLICT', message: 'Client has quotes' } }, 409)
    );

    const error = await apiFetch('/api/clients/1').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'CONFLICT',
      message: 'Client has quotes',
    });
  });

  it('garde le vrai statut quand la réponse d’erreur n’est pas du JSON', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(
      new Response('<html>Bad gateway</html>', { status: 502 })
    );

    const error = await apiFetch('/api/health').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 502, message: 'Erreur API : 502' });
  });

  it('lève une ApiError 503 quand l’API est injoignable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const error = await apiFetch('/api/health').catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 503, code: 'API_UNREACHABLE' });
  });

  it('signale une configuration manquante par une erreur claire', async () => {
    delete process.env.API_URL;

    await expect(apiFetch('/api/health')).rejects.toThrow('API_URL');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('apiFetchPrivate', () => {
  it('transmet le jeton du cookie en Authorization: Bearer', async () => {
    cookieStore.get.mockReturnValue({ value: 'jeton-123' });
    fetchMock.mockResolvedValue(json({ data: [] }));

    await apiFetchPrivate('/api/clients');

    const [, options] = fetchMock.mock.calls[0];
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });

  it('n’envoie aucun en-tête Authorization sans cookie de session', async () => {
    cookieStore.get.mockReturnValue(undefined);
    fetchMock.mockResolvedValue(json({ data: [] }));

    await apiFetchPrivate('/api/clients');

    const [, options] = fetchMock.mock.calls[0];
    expect(new Headers(options.headers).has('Authorization')).toBe(false);
  });
});

describe('getCurrentUserOrNull', () => {
  it('renvoie null, sans appeler l’API, quand il n’y a pas de session', async () => {
    cookieStore.has.mockReturnValue(false);

    await expect(getCurrentUserOrNull()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renvoie l’utilisateur quand l’API accepte le jeton', async () => {
    cookieStore.has.mockReturnValue(true);
    cookieStore.get.mockReturnValue({ value: 'jeton-123' });
    fetchMock.mockResolvedValue(json({ data: USER }));

    await expect(getCurrentUserOrNull()).resolves.toEqual(USER);
  });

  it('renvoie null quand l’API refuse le jeton (401)', async () => {
    cookieStore.has.mockReturnValue(true);
    cookieStore.get.mockReturnValue({ value: 'expire' });
    fetchMock.mockResolvedValue(
      json(
        {
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
        },
        401
      )
    );

    await expect(getCurrentUserOrNull()).resolves.toBeNull();
  });

  it('relance les autres erreurs (API en panne)', async () => {
    cookieStore.has.mockReturnValue(true);
    cookieStore.get.mockReturnValue({ value: 'jeton-123' });
    fetchMock.mockResolvedValue(
      json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur' } }, 500)
    );

    await expect(getCurrentUserOrNull()).rejects.toMatchObject({ status: 500 });
  });
});
