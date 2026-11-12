import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: vi.fn(), has: vi.fn() }),
}));

import { apiFetch } from '@/lib/api';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
});

describe('apiFetch : erreur de validation', () => {
  it('conserve le détail des champs refusés par l’API', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: [{ path: 'email', message: 'Invalid email address' }],
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const error = await apiFetch('/api/clients').catch((e: unknown) => e);

    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: [{ path: 'email', message: 'Invalid email address' }],
    });
  });
});
