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
  addPhaseAction,
  deletePhaseAction,
} from '@/app/(app)/chantiers/phase-actions';
import {
  PHASE_FIELD_MESSAGES,
  PHASE_STRUCTURE_MESSAGE,
  phaseInitialState,
} from '@/lib/phase-form';

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
  details?: { path: string; message: string }[]
) {
  return json(
    { error: { code, message: 'x', ...(details && { details }) } },
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

beforeEach(() => {
  vi.resetAllMocks();
  nav.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('addPhaseAction', () => {
  it('ajoute la phase avec des heures en chaîne décimale, puis revient à la fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }, 201));

    await expect(
      addPhaseAction(
        4,
        phaseInitialState(),
        form({ name: 'Ponçage', estimatedHours: '7,5', notes: '' })
      )
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites/4/phases');
    expect(options.method).toBe('POST');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
    expect(JSON.parse(options.body)).toEqual({
      name: 'Ponçage',
      estimatedHours: '7.5',
    });
  });

  it('n’envoie que le nom quand l’estimation et les notes sont vides', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }, 201));

    await expect(
      addPhaseAction(4, phaseInitialState(), form({ name: 'Ponçage' }))
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'Ponçage',
    });
  });

  it('refuse un nom vide sans appeler l’API', async () => {
    const state = await addPhaseAction(4, phaseInitialState(), form({}));

    expect(state.fieldErrors.name).toBe(PHASE_FIELD_MESSAGES.name);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse des heures invalides sans appeler l’API, et garde la saisie', async () => {
    const state = await addPhaseAction(
      4,
      phaseInitialState(),
      form({ name: 'Ponçage', estimatedHours: '1.234' })
    );

    expect(state.fieldErrors.estimatedHours).toBe(
      PHASE_FIELD_MESSAGES.estimatedHours
    );
    expect(state.values.name).toBe('Ponçage');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('place les champs refusés par l’API et garde la saisie', async () => {
    fetchMock.mockResolvedValue(
      apiError(400, 'VALIDATION_ERROR', [
        { path: 'notes', message: 'Too big' },
        { path: 'assigneeId', message: 'ignoré' },
      ])
    );

    const state = await addPhaseAction(
      4,
      phaseInitialState(),
      form({ name: 'Ponçage' })
    );

    expect(state.fieldErrors).toEqual({ notes: PHASE_FIELD_MESSAGES.notes });
    expect(state.message).toBe(
      'Certaines informations sont invalides. Vérifiez les champs.'
    );
    expect(state.values.name).toBe('Ponçage');
  });

  it('explique que les phases ne se modifient plus (409)', async () => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT'));

    const state = await addPhaseAction(
      4,
      phaseInitialState(),
      form({ name: 'Ponçage' })
    );

    expect(state.message).toBe(PHASE_STRUCTURE_MESSAGE);
    expect(state.values.name).toBe('Ponçage');
  });

  it('indique qu’un chantier inexistant n’existe plus (404)', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    const state = await addPhaseAction(
      4,
      phaseInitialState(),
      form({ name: 'Ponçage' })
    );

    expect(state.message).toBe('Ce chantier n’existe plus.');
  });

  it('affiche un message générique pour une panne de l’API', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    const state = await addPhaseAction(
      4,
      phaseInitialState(),
      form({ name: 'Ponçage' })
    );

    expect(state.message).toBe('Une erreur est survenue. Réessayez.');
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(
      addPhaseAction(4, phaseInitialState(), form({ name: 'Ponçage' }))
    ).rejects.toThrow('NEXT_REDIRECT /connexion?session=expiree');
  });
});

describe('deletePhaseAction', () => {
  it('supprime la phase puis revient à la fiche du chantier', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(deletePhaseAction(4, 12)).rejects.toThrow(
      'NEXT_REDIRECT /chantiers/4'
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites/4/phases/12');
    expect(options.method).toBe('DELETE');
  });

  it.each([404, 409])(
    'revient à la fiche, qui montre la situation réelle, après un refus %i',
    async (status) => {
      fetchMock.mockResolvedValue(
        apiError(status, status === 404 ? 'NOT_FOUND' : 'CONFLICT')
      );

      await expect(deletePhaseAction(4, 12)).rejects.toThrow(
        'NEXT_REDIRECT /chantiers/4'
      );
    }
  );

  it('relance les autres erreurs de l’API', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    await expect(deletePhaseAction(4, 12)).rejects.toMatchObject({
      status: 500,
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(deletePhaseAction(4, 12)).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });
});
