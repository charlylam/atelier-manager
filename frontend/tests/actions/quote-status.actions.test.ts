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

import {
  changeQuoteStatusAction,
  duplicateQuoteAction,
} from '@/app/(app)/devis/status-actions';

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
  'Le statut de ce devis a changé entre-temps. Rechargez la page pour voir la situation actuelle.';

beforeEach(() => {
  vi.resetAllMocks();
  nav.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('changeQuoteStatusAction', () => {
  it.each(['sent', 'accepted', 'rejected'] as const)(
    'demande le statut %s puis revient à la fiche du devis',
    async (target) => {
      fetchMock.mockResolvedValue(json({ data: { id: 7 } }));

      await expect(changeQuoteStatusAction(7, target)).rejects.toThrow(
        'NEXT_REDIRECT /devis/7'
      );

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('http://api.test/api/quotes/7/status');
      expect(options.method).toBe('PATCH');
      expect(new Headers(options.headers).get('Authorization')).toBe(
        'Bearer jeton-123'
      );
      expect(JSON.parse(options.body)).toEqual({ status: target });
    }
  );

  it.each([
    [
      'A quote without lines cannot be sent',
      'Un devis sans ligne ne peut pas être envoyé. Ajoutez au moins une ligne.',
    ],
    [
      'Quote validity date is in the past',
      'La date de validité est dépassée. Modifiez-la avant de marquer le devis comme envoyé.',
    ],
    ['Quote status has changed, please reload', CHANGED],
    ['Cannot change quote status from accepted to sent', CHANGED],
    ['Un autre refus', 'Une erreur est survenue. Réessayez.'],
  ])('traduit le refus 409 « %s »', async (apiMessage, expected) => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT', apiMessage));

    const state = await changeQuoteStatusAction(7, 'sent');

    expect(state).toEqual({ message: expected });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('indique qu’un devis inexistant n’existe plus', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    expect(await changeQuoteStatusAction(7, 'sent')).toEqual({
      message: 'Ce devis n’existe plus.',
    });
  });

  it('affiche le message générique d’une erreur de validation', async () => {
    fetchMock.mockResolvedValue(apiError(400, 'VALIDATION_ERROR'));

    expect(await changeQuoteStatusAction(7, 'sent')).toEqual({
      message: 'Certaines informations sont invalides. Vérifiez les champs.',
    });
  });

  it('affiche un message générique pour une panne de l’API, sans changer de page', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    expect(await changeQuoteStatusAction(7, 'sent')).toEqual({
      message: 'Une erreur est survenue. Réessayez.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(changeQuoteStatusAction(7, 'sent')).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });
});

describe('duplicateQuoteAction', () => {
  it('copie le devis puis ouvre la fiche de la copie', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 21 } }, 201));

    await expect(duplicateQuoteAction(5)).rejects.toThrow(
      'NEXT_REDIRECT /devis/21'
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5/duplicate');
    expect(options.method).toBe('POST');
  });

  it('indique qu’un devis inexistant n’existe plus', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    expect(await duplicateQuoteAction(5)).toEqual({
      message: 'Ce devis n’existe plus.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('traduit l’échec d’attribution de la référence', async () => {
    fetchMock.mockResolvedValue(
      apiError(
        409,
        'CONFLICT',
        'Could not allocate a quote reference, please retry'
      )
    );

    expect(await duplicateQuoteAction(5)).toEqual({
      message: 'Impossible d’attribuer une référence à la copie. Réessayez.',
    });
  });

  it('affiche un message générique pour une panne de l’API, sans changer de page', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    expect(await duplicateQuoteAction(5)).toEqual({
      message: 'Une erreur est survenue. Réessayez.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(duplicateQuoteAction(5)).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });
});
