import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { ApiError } from '@/lib/errors';
import { getWorksite, listWorksites } from '@/lib/worksites';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const META = { page: 1, limit: 20, total: 0, totalPages: 0 };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('listWorksites', () => {
  it('interroge l’API sans paramètre par défaut, et renvoie chantiers et pagination', async () => {
    fetchMock.mockResolvedValue(
      json({
        data: [{ id: 1, reference: 'CH-2026-0001' }],
        meta: { ...META, total: 1, totalPages: 1 },
      })
    );

    const result = await listWorksites();

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/worksites');
    expect(result.worksites).toEqual([{ id: 1, reference: 'CH-2026-0001' }]);
    expect(result.pagination.total).toBe(1);
  });

  it('transmet statut, recherche et page, avec le jeton de session', async () => {
    fetchMock.mockResolvedValue(json({ data: [], meta: META }));

    await listWorksites({ status: 'in_production', search: 'chêne', page: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'http://api.test/api/worksites?status=in_production&search=ch%C3%AAne&page=2'
    );
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });

  it('n’envoie pas le paramètre page pour la page 1', async () => {
    fetchMock.mockResolvedValue(json({ data: [], meta: META }));

    await listWorksites({ status: 'ready', page: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/api/worksites?status=ready'
    );
  });
});

describe('getWorksite', () => {
  it('renvoie le chantier', async () => {
    fetchMock.mockResolvedValue(
      json({ data: { id: 4, reference: 'CH-2026-0004', phases: [] } })
    );

    const worksite = await getWorksite(4);

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/worksites/4');
    expect(worksite.reference).toBe('CH-2026-0004');
  });

  it('lève une ApiError 404 quand le chantier n’existe pas', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'NOT_FOUND', message: 'Worksite not found' } }, 404)
    );

    await expect(getWorksite(99)).rejects.toMatchObject({
      constructor: ApiError,
      status: 404,
    });
  });
});
