import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { POST } from '@/app/api/auth/login/route';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function loginRequest(body: unknown) {
  return new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const CREDENTIALS = {
  email: 'admin@atelier-martin.test',
  password: 'Demo2026!',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
});

describe('POST /api/auth/login', () => {
  it('pose le cookie de session et renvoie l’utilisateur', async () => {
    fetchMock.mockResolvedValue(
      json({ token: 'jeton-123', user: { id: 1, firstName: 'Pierre' } })
    );

    const response = await POST(loginRequest(CREDENTIALS));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { user: { id: 1, firstName: 'Pierre' } },
    });
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'token',
        value: 'jeton-123',
        httpOnly: true,
      })
    );
  });

  it('ne renvoie jamais le jeton au navigateur', async () => {
    fetchMock.mockResolvedValue(
      json({ token: 'jeton-secret', user: { id: 1 } })
    );

    const response = await POST(loginRequest(CREDENTIALS));

    expect(await response.text()).not.toContain('jeton-secret');
  });

  it('ne transmet à l’API que l’e-mail et le mot de passe', async () => {
    fetchMock.mockResolvedValue(json({ token: 'jeton-123', user: { id: 1 } }));

    await POST(loginRequest({ ...CREDENTIALS, role: 'admin', extra: 'x' }));

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/auth/login');
    expect(JSON.parse(options.body)).toEqual(CREDENTIALS);
  });

  it('conserve le statut 401 de l’API pour un mot de passe erroné', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
        },
        401
      )
    );

    const response = await POST(loginRequest(CREDENTIALS));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('conserve le statut 429 quand l’API limite les tentatives', async () => {
    fetchMock.mockResolvedValue(
      json(
        { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts' } },
        429
      )
    );

    const response = await POST(loginRequest(CREDENTIALS));

    expect(response.status).toBe(429);
  });

  it('répond 503 quand l’API est injoignable, et non 500', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const response = await POST(loginRequest(CREDENTIALS));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'API_UNREACHABLE' },
    });
  });

  it('répond 400, sans appeler l’API, quand les champs manquent ou que le JSON est illisible', async () => {
    for (const body of [
      { email: 'a@b.fr' },
      { password: 'x' },
      '{"email":',
      {},
    ]) {
      const response = await POST(loginRequest(body));
      expect(response.status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
