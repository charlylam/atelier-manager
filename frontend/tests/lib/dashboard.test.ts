import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { getDashboard } from '@/lib/dashboard';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
  fetchMock.mockResolvedValue(
    new Response(JSON.stringify({ data: { revenue: { month: '2026-09' } } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
});

describe('getDashboard', () => {
  it('interroge l’API sans paramètre pour le mois courant', async () => {
    const data = await getDashboard();

    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/dashboard');
    expect(data).toEqual({ revenue: { month: '2026-09' } });
  });

  it('transmet le mois choisi et le jeton de session', async () => {
    await getDashboard('2026-09');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/dashboard?month=2026-09');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });
});
