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
  createWorksiteAction,
  updateWorksiteAction,
} from '@/app/(app)/chantiers/actions';
import {
  NOT_EDITABLE_MESSAGE,
  WORKSITE_FIELD_MESSAGES,
  worksiteInitialState,
} from '@/lib/worksite-form';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function apiError(
  status: number,
  code: string,
  message = 'x',
  details?: { path: string; message: string }[]
) {
  return json(
    { error: { code, message, ...(details && { details }) } },
    status
  );
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

const INITIAL = worksiteInitialState({
  title: '',
  description: '',
  siteAddress: '',
  dueDate: '',
});

beforeEach(() => {
  vi.resetAllMocks();
  nav.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('createWorksiteAction', () => {
  it('envoie le devis puis ouvre la fiche du chantier créé (201)', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 31 } }, 201));

    await expect(createWorksiteAction(7)).rejects.toThrow(
      'NEXT_REDIRECT /chantiers/31'
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites');
    expect(options.method).toBe('POST');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
    expect(new Headers(options.headers).get('Content-Type')).toBe(
      'application/json'
    );
    expect(JSON.parse(options.body)).toEqual({ quoteId: 7 });
  });

  it('ouvre le chantier existant quand l’API le renvoie (200)', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 12 } }, 200));

    await expect(createWorksiteAction(7)).rejects.toThrow(
      'NEXT_REDIRECT /chantiers/12'
    );
  });

  it.each([
    [
      'Only an accepted quote can become a worksite',
      'Seul un devis accepté peut devenir un chantier.',
    ],
    [
      'Could not allocate a worksite reference, please retry',
      'Impossible d’attribuer une référence au chantier. Réessayez.',
    ],
    ['Un autre refus', 'Une erreur est survenue. Réessayez.'],
  ])('traduit le refus 409 « %s »', async (apiMessage, expected) => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT', apiMessage));

    expect(await createWorksiteAction(7)).toEqual({ message: expected });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('indique qu’un devis inexistant n’existe plus', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    expect(await createWorksiteAction(7)).toEqual({
      message: 'Ce devis n’existe plus.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('affiche le message générique d’une erreur de validation', async () => {
    fetchMock.mockResolvedValue(apiError(400, 'VALIDATION_ERROR'));

    expect(await createWorksiteAction(7)).toEqual({
      message: 'Certaines informations sont invalides. Vérifiez les champs.',
    });
  });

  it('affiche un message générique pour une panne de l’API, sans changer de page', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    expect(await createWorksiteAction(7)).toEqual({
      message: 'Une erreur est survenue. Réessayez.',
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(createWorksiteAction(7)).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });

  it('relance une erreur qui ne vient pas de l’API', async () => {
    cookieStore.get.mockImplementation(() => {
      throw new Error('cookies indisponibles');
    });

    await expect(createWorksiteAction(7)).rejects.toThrow(
      'cookies indisponibles'
    );
  });
});

describe('updateWorksiteAction', () => {
  it('modifie le chantier, efface les champs vidés, puis revient à sa fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(
      updateWorksiteAction(
        4,
        INITIAL,
        form({
          title: ' Bibliothèque ',
          description: '',
          siteAddress: '',
          dueDate: '2026-12-15',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites/4');
    expect(options.method).toBe('PATCH');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
    expect(JSON.parse(options.body)).toEqual({
      title: 'Bibliothèque',
      description: null,
      siteAddress: null,
      dueDate: '2026-12-15',
    });
  });

  it('accepte une échéance passée', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(
      updateWorksiteAction(
        4,
        INITIAL,
        form({ title: 'A', dueDate: '2020-01-01' })
      )
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');
  });

  it('refuse un titre vide sans appeler l’API', async () => {
    const state = await updateWorksiteAction(4, INITIAL, form({ title: ' ' }));

    expect(state.fieldErrors.title).toBe(WORKSITE_FIELD_MESSAGES.title);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('place les champs refusés par l’API et garde la saisie', async () => {
    fetchMock.mockResolvedValue(
      apiError(400, 'VALIDATION_ERROR', 'x', [
        { path: 'dueDate', message: 'Invalid date' },
        { path: 'inconnu', message: 'ignoré' },
      ])
    );

    const state = await updateWorksiteAction(
      4,
      INITIAL,
      form({ title: 'Bibliothèque' })
    );

    expect(state.fieldErrors).toEqual({
      dueDate: WORKSITE_FIELD_MESSAGES.dueDate,
    });
    expect(state.message).toBe(
      'Certaines informations sont invalides. Vérifiez les champs.'
    );
    expect(state.values.title).toBe('Bibliothèque');
  });

  it('explique qu’un chantier livré ou annulé ne se modifie plus (409)', async () => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT'));

    const state = await updateWorksiteAction(
      4,
      INITIAL,
      form({ title: 'Bibliothèque' })
    );

    expect(state.message).toBe(NOT_EDITABLE_MESSAGE);
    expect(state.values.title).toBe('Bibliothèque');
  });

  it('indique qu’un chantier inexistant n’existe plus (404)', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    const state = await updateWorksiteAction(4, INITIAL, form({ title: 'A' }));

    expect(state.message).toBe('Ce chantier n’existe plus.');
  });

  it('affiche un message générique pour une panne de l’API', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    const state = await updateWorksiteAction(4, INITIAL, form({ title: 'A' }));

    expect(state.message).toBe('Une erreur est survenue. Réessayez.');
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(
      updateWorksiteAction(4, INITIAL, form({ title: 'A' }))
    ).rejects.toThrow('NEXT_REDIRECT /connexion?session=expiree');
  });

  it('relance une erreur qui ne vient pas de l’API', async () => {
    cookieStore.get.mockImplementation(() => {
      throw new Error('cookies indisponibles');
    });

    await expect(
      updateWorksiteAction(4, INITIAL, form({ title: 'A' }))
    ).rejects.toThrow('cookies indisponibles');
  });
});
