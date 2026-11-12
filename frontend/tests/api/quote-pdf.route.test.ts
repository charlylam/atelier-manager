import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { GET } from '@/app/(app)/devis/[id]/pdf/route';

const fetchMock = vi.fn();

function call(id: string) {
  return GET(new Request(`http://localhost:3000/devis/${id}/pdf`), {
    params: Promise.resolve({ id }),
  });
}

function apiError(status: number, code: string) {
  return new Response(JSON.stringify({ error: { code, message: 'x' } }), {
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

describe('GET /devis/:id/pdf', () => {
  it('relaie le PDF de l’API, avec le jeton de session et le nom de fichier de l’API', async () => {
    fetchMock.mockResolvedValue(
      new Response('%PDF-1.4 contenu', {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="DEV-2026-0001.pdf"',
        },
      })
    );

    const response = await call('5');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="DEV-2026-0001.pdf"'
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).toBe('%PDF-1.4 contenu');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5/pdf');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
  });

  it('propose un nom de fichier quand l’API n’en donne pas', async () => {
    fetchMock.mockResolvedValue(new Response('%PDF', { status: 200 }));

    const response = await call('5');

    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="devis-5.pdf"'
    );
  });

  it('renvoie vers la connexion quand le jeton est refusé', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    const response = await call('5');

    expect(response.status).toBe(307);
    expect(
      new URL(response.headers.get('location') ?? '').pathname +
        new URL(response.headers.get('location') ?? '').search
    ).toBe('/connexion?session=expiree');
  });

  it('répond 404 pour un devis inexistant ou d’un autre atelier', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    expect((await call('999')).status).toBe(404);
  });

  it('répond 404, sans appeler l’API, pour un identifiant invalide', async () => {
    expect((await call('abc')).status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('répond 502 quand l’API est en panne ou injoignable', async () => {
    fetchMock.mockResolvedValueOnce(apiError(500, 'INTERNAL_ERROR'));
    expect((await call('5')).status).toBe(502);

    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect((await call('5')).status).toBe(502);
  });
});
