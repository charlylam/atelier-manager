import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { apiFetchPrivateResponse } from '@/lib/api';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('apiFetchPrivateResponse', () => {
  it('renvoie la réponse brute, avec le jeton de session', async () => {
    fetchMock.mockResolvedValue(
      new Response('%PDF-1.4', {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      })
    );

    const response = await apiFetchPrivateResponse('/api/quotes/5/pdf');

    expect(await response.text()).toBe('%PDF-1.4');
    expect(response.headers.get('content-type')).toBe('application/pdf');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5/pdf');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });

  it('lève une ApiError avec le statut de l’API quand elle refuse', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'NOT_FOUND', message: 'Quote not found' },
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    await expect(
      apiFetchPrivateResponse('/api/quotes/9/pdf')
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('lève une ApiError 503 quand l’API est injoignable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(
      apiFetchPrivateResponse('/api/quotes/9/pdf')
    ).rejects.toMatchObject({
      status: 503,
      code: 'API_UNREACHABLE',
    });
  });
});
