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
  createClientAction,
  deleteClientAction,
  updateClientAction,
} from '@/app/(app)/clients/actions';
import { EMPTY_VALUES, FIELD_MESSAGES, initialState } from '@/lib/client-form';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

const INITIAL = initialState();

beforeEach(() => {
  vi.resetAllMocks();
  nav.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('createClientAction', () => {
  it('crée le client, sans les champs vides, puis ouvre sa fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 12 } }, 201));

    await expect(
      createClientAction(
        INITIAL,
        form({
          name: '  Famille Durand ',
          isCompany: 'false',
          email: '',
          phone: '06 12',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT /clients/12');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/clients');
    expect(options.method).toBe('POST');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
    expect(JSON.parse(options.body)).toEqual({
      name: 'Famille Durand',
      isCompany: false,
      phone: '06 12',
    });
  });

  it('refuse un nom vide sans appeler l’API, et garde la saisie', async () => {
    const state = await createClientAction(
      INITIAL,
      form({ name: '   ', email: 'a@b.fr' })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.fieldErrors).toEqual({ name: FIELD_MESSAGES.name });
    expect(state.values).toEqual({ ...EMPTY_VALUES, email: 'a@b.fr' });
  });

  it('affiche en français les champs que l’API refuse, et garde la saisie', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: [{ path: 'email', message: 'Invalid email address' }],
          },
        },
        400
      )
    );

    const state = await createClientAction(
      INITIAL,
      form({ name: 'Durand', email: 'pas-un-email' })
    );

    expect(state.message).toBe(
      'Certaines informations sont invalides. Vérifiez les champs.'
    );
    expect(state.fieldErrors).toEqual({ email: FIELD_MESSAGES.email });
    expect(state.values.email).toBe('pas-un-email');
  });

  it('affiche un message quand l’API est injoignable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const state = await createClientAction(INITIAL, form({ name: 'Durand' }));

    expect(state.message).toContain('momentanément indisponible');
    expect(state.values.name).toBe('Durand');
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
        },
        401
      )
    );

    await expect(
      createClientAction(INITIAL, form({ name: 'Durand' }))
    ).rejects.toThrow('NEXT_REDIRECT /connexion?session=expiree');
  });
});

describe('updateClientAction', () => {
  it('modifie le client, efface les champs vidés, puis revient à sa fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 5 } }));

    await expect(
      updateClientAction(
        5,
        INITIAL,
        form({ name: 'Durand', isCompany: 'true', email: '', phone: '06' })
      )
    ).rejects.toThrow('NEXT_REDIRECT /clients/5');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/clients/5');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({
      name: 'Durand',
      isCompany: true,
      email: null,
      phone: '06',
      address: null,
      notes: null,
    });
  });

  it('refuse un nom vide sans appeler l’API', async () => {
    const state = await updateClientAction(5, INITIAL, form({ name: '' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.fieldErrors.name).toBe(FIELD_MESSAGES.name);
  });

  it('signale un client supprimé entre-temps', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'NOT_FOUND', message: 'Client not found' } }, 404)
    );

    const state = await updateClientAction(
      5,
      INITIAL,
      form({ name: 'Durand' })
    );

    expect(state.message).toBe('Ce client n’existe plus.');
  });
});

describe('deleteClientAction', () => {
  it('supprime le client puis revient à la liste', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteClientAction(5)).rejects.toThrow(
      'NEXT_REDIRECT /clients'
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/clients/5');
    expect(options.method).toBe('DELETE');
  });

  it('explique le refus de l’API (409) quand le client a un historique', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Client has quotes or worksites and cannot be deleted',
          },
        },
        409
      )
    );

    const state = await deleteClientAction(5);

    expect(state.message).toBe(
      'Ce client a des devis ou des chantiers : il ne peut pas être supprimé.'
    );
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('signale un client déjà supprimé', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'NOT_FOUND', message: 'Client not found' } }, 404)
    );

    expect((await deleteClientAction(5)).message).toBe(
      'Ce client n’existe plus.'
    );
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(
      json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401)
    );

    await expect(deleteClientAction(5)).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });
});
