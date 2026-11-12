import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { POST } from '@/app/api/auth/register/route';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const FIELDS = {
  workshopName: 'Atelier Martin',
  firstName: 'Pierre',
  lastName: 'Martin',
  email: 'pierre@atelier-martin.test',
  password: 'Demo2026!',
};

function registerRequest(body: unknown) {
  return new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
});

describe('POST /api/auth/register', () => {
  it('crée l’atelier, ouvre la session et répond 201', async () => {
    fetchMock
      .mockResolvedValueOnce(
        json({ message: 'Account created', user: { id: 1 } }, 201)
      )
      .mockResolvedValueOnce(json({ token: 'jeton-123', user: { id: 1 } }));

    const response = await POST(registerRequest(FIELDS));

    expect(response.status).toBe(201);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/api/auth/register'
    );
    expect(fetchMock.mock.calls[1][0]).toBe('http://api.test/api/auth/login');
    expect(cookieStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'jeton-123' })
    );
  });

  it('conserve le statut 409 quand l’e-mail ou l’atelier existe déjà', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Email or workshop name already in use',
          },
        },
        409
      )
    );

    const response = await POST(registerRequest(FIELDS));

    expect(response.status).toBe(409);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('répond 400, sans appeler l’API, quand un champ manque', async () => {
    const { workshopName, ...incomplete } = FIELDS;
    void workshopName;

    const response = await POST(registerRequest(incomplete));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
