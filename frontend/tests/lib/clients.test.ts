import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { getClient, listClients } from '@/lib/clients';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('listClients', () => {
  it('interroge l’API sans paramètre par défaut, et renvoie clients et pagination', async () => {
    fetchMock.mockResolvedValue(
      json({
        data: [{ id: 1, name: 'Famille Durand' }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })
    );

    const result = await listClients();

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/clients');
    expect(result.clients).toEqual([{ id: 1, name: 'Famille Durand' }]);
    expect(result.pagination.total).toBe(1);
  });

  it('transmet la recherche et la page, avec le jeton de session', async () => {
    fetchMock.mockResolvedValue(
      json({ data: [], meta: { page: 2, limit: 20, total: 0, totalPages: 0 } })
    );

    await listClients({ search: 'Dupont & fils', page: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'http://api.test/api/clients?search=Dupont+%26+fils&page=2'
    );
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });

  it('n’envoie pas le paramètre page pour la page 1', async () => {
    fetchMock.mockResolvedValue(
      json({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } })
    );

    await listClients({ search: 'durand', page: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/api/clients?search=durand'
    );
  });
});

describe('getClient', () => {
  it('renvoie la fiche du client', async () => {
    fetchMock.mockResolvedValue(
      json({
        data: { id: 7, name: 'Menuiserie Dubois', quotes: [], worksites: [] },
      })
    );

    const client = await getClient(7);

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/clients/7');
    expect(client.name).toBe('Menuiserie Dubois');
  });

  it('lève une ApiError 404 pour un client inexistant', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'NOT_FOUND', message: 'Client not found' } }, 404)
    );

    await expect(getClient(999)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
