import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { listClients } from '@/lib/clients';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        data: [],
        meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  );
});

describe('listClients : limite', () => {
  it('transmet la limite demandée, pour les listes de choix', async () => {
    await listClients({ limit: 100 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/api/clients?limit=100'
    );
  });

  it('place la limite après la recherche et la page', async () => {
    await listClients({ search: 'durand', page: 2, limit: 50 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/api/clients?search=durand&page=2&limit=50'
    );
  });
});
