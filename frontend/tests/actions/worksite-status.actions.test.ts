import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), has: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

// redirect() lève une exception de contrôle : on la reproduit pour vérifier la destination.
const nav = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock('next/navigation', () => nav);

import { changeWorksiteStatusAction } from '@/app/(app)/chantiers/status-actions';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function apiError(status: number, code: string, message = 'x') {
  return json({ error: { code, message } }, status);
}

const CHANGED =
  'Le statut de ce chantier a changé entre-temps. Rechargez la page pour voir la situation actuelle.';

beforeEach(() => {
  vi.resetAllMocks();
  nav.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('changeWorksiteStatusAction', () => {
  it.each(['in_production', 'ready', 'delivered', 'canceled'] as const)(
    'demande le statut %s puis revient à la fiche du chantier',
    async (target) => {
      fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

      await expect(changeWorksiteStatusAction(4, target)).rejects.toThrow(
        'NEXT_REDIRECT /chantiers/4'
      );

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('http://api.test/api/worksites/4/status');
      expect(options.method).toBe('PATCH');
      expect(new Headers(options.headers).get('Authorization')).toBe(
        'Bearer jeton-123'
      );
      expect(JSON.parse(options.body)).toEqual({ status: target });
    }
  );

  it.each([
    [
      'All phases must be done before the worksite is ready',
      'Toutes les phases doivent être terminées avant de marquer le chantier comme prêt à livrer.',
    ],
    ['Worksite status has changed, please reload', CHANGED],
    ['Cannot change worksite status from delivered to ready', CHANGED],
    ['Un autre refus', 'Une erreur est survenue. Réessayez.'],
  ])('traduit le refus 409 « %s »', async (apiMessage, expected) => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT', apiMessage));

    expect(await changeWorksiteStatusAction(4, 'ready')).toEqual({
      message: expected,
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('indique qu’un chantier inexistant n’existe plus', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    expect(await changeWorksiteStatusAction(4, 'ready')).toEqual({
      message: 'Ce chantier n’existe plus.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('affiche le message générique d’une erreur de validation', async () => {
    fetchMock.mockResolvedValue(apiError(400, 'VALIDATION_ERROR'));

    expect(await changeWorksiteStatusAction(4, 'ready')).toEqual({
      message: 'Certaines informations sont invalides. Vérifiez les champs.',
    });
  });

  it('affiche un message générique pour une panne de l’API, sans changer de page', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    expect(await changeWorksiteStatusAction(4, 'ready')).toEqual({
      message: 'Une erreur est survenue. Réessayez.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(changeWorksiteStatusAction(4, 'ready')).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });

  it('relance une erreur qui ne vient pas de l’API', async () => {
    cookieStore.get.mockImplementation(() => {
      throw new Error('cookies indisponibles');
    });

    await expect(changeWorksiteStatusAction(4, 'ready')).rejects.toThrow(
      'cookies indisponibles'
    );
  });
});
