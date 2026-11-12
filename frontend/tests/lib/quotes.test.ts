import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { getQuote, listQuotes } from '@/lib/quotes';

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

describe('listQuotes', () => {
  it('interroge l’API sans paramètre par défaut', async () => {
    fetchMock.mockResolvedValue(
      json({ data: [{ id: 1 }], meta: { ...META, total: 1, totalPages: 1 } })
    );

    const result = await listQuotes();

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/quotes');
    expect(result.quotes).toEqual([{ id: 1 }]);
    expect(result.pagination.total).toBe(1);
  });

  it('transmet le statut, la recherche et la page, avec le jeton', async () => {
    fetchMock.mockResolvedValue(json({ data: [], meta: META }));

    await listQuotes({ status: 'sent', search: 'chêne', page: 2 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'http://api.test/api/quotes?status=sent&search=ch%C3%AAne&page=2'
    );
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });

  it('n’envoie pas le paramètre page pour la page 1', async () => {
    fetchMock.mockResolvedValue(json({ data: [], meta: META }));

    await listQuotes({ status: 'draft', page: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://api.test/api/quotes?status=draft'
    );
  });
});

describe('getQuote', () => {
  it('renvoie le devis', async () => {
    fetchMock.mockResolvedValue(
      json({ data: { id: 7, reference: 'DEV-2026-0001' } })
    );

    const quote = await getQuote(7);

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/quotes/7');
    expect(quote.reference).toBe('DEV-2026-0001');
  });

  it('lève une ApiError 404 pour un devis inexistant', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'NOT_FOUND', message: 'Quote not found' } }, 404)
    );

    await expect(getQuote(999)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });
});
