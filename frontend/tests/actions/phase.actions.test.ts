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
  changePhaseHoursAction,
  changePhaseStatusAction,
  deletePhaseAction,
  movePhaseAction,
  updatePhaseAction,
} from '@/app/(app)/chantiers/phase-actions';
import { HOURS_MESSAGE, PROGRESS_LOCKED_MESSAGE } from '@/lib/phase-progress';
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
  details?: { path: string; message: string }[],
  message = 'x'
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

describe('updatePhaseAction', () => {
  it('modifie nom, estimation et notes (effacées en null), puis revient à la fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(
      updatePhaseAction(
        4,
        12,
        phaseInitialState(),
        form({ name: ' Ponçage fin ', estimatedHours: '7,5', notes: '' })
      )
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites/4/phases/12');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({
      name: 'Ponçage fin',
      estimatedHours: '7.5',
      notes: null,
    });
  });

  it('refuse un nom vide sans appeler l’API', async () => {
    const state = await updatePhaseAction(4, 12, phaseInitialState(), form({}));

    expect(state.fieldErrors.name).toBe(PHASE_FIELD_MESSAGES.name);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explique que les phases ne se modifient plus (409) et garde la saisie', async () => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT'));

    const state = await updatePhaseAction(
      4,
      12,
      phaseInitialState(),
      form({ name: 'Ponçage' })
    );

    expect(state.message).toBe(PHASE_STRUCTURE_MESSAGE);
    expect(state.values.name).toBe('Ponçage');
  });

  it('distingue une phase absente d’un chantier absent (404)', async () => {
    fetchMock.mockResolvedValueOnce(
      apiError(404, 'NOT_FOUND', undefined, 'Phase not found')
    );
    fetchMock.mockResolvedValueOnce(
      apiError(404, 'NOT_FOUND', undefined, 'Worksite not found')
    );

    const phase = await updatePhaseAction(
      4,
      12,
      phaseInitialState(),
      form({ name: 'A' })
    );
    const worksite = await updatePhaseAction(
      4,
      12,
      phaseInitialState(),
      form({ name: 'A' })
    );

    expect(phase.message).toBe('Cette phase n’existe plus.');
    expect(worksite.message).toBe('Ce chantier n’existe plus.');
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(
      updatePhaseAction(4, 12, phaseInitialState(), form({ name: 'A' }))
    ).rejects.toThrow('NEXT_REDIRECT /connexion?session=expiree');
  });
});

describe('changePhaseStatusAction', () => {
  it.each(['todo', 'in_progress', 'done'] as const)(
    'demande le statut %s puis revient à la fiche, sans autre champ',
    async (target) => {
      fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

      await expect(changePhaseStatusAction(4, 12, target)).rejects.toThrow(
        'NEXT_REDIRECT /chantiers/4'
      );

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('http://api.test/api/worksites/4/phases/12');
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ status: target });
    }
  );

  it.each([
    [
      'Cannot change phase status from done to todo',
      'Le statut de cette phase a changé entre-temps. Rechargez la page pour voir la situation actuelle.',
    ],
    [
      'Phase progress can only be changed while the worksite is in production',
      PROGRESS_LOCKED_MESSAGE,
    ],
  ])('traduit le refus 409 « %s »', async (apiMessage, expected) => {
    fetchMock.mockResolvedValue(
      apiError(409, 'CONFLICT', undefined, apiMessage)
    );

    expect(await changePhaseStatusAction(4, 12, 'done')).toEqual({
      message: expected,
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('indique qu’une phase inexistante n’existe plus (404)', async () => {
    fetchMock.mockResolvedValue(
      apiError(404, 'NOT_FOUND', undefined, 'Phase not found')
    );

    expect(await changePhaseStatusAction(4, 12, 'done')).toEqual({
      message: 'Cette phase n’existe plus.',
    });
  });

  it('affiche un message générique pour une panne de l’API', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    expect(await changePhaseStatusAction(4, 12, 'done')).toEqual({
      message: 'Une erreur est survenue. Réessayez.',
    });
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(changePhaseStatusAction(4, 12, 'done')).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });

  it('relance une erreur qui ne vient pas de l’API', async () => {
    cookieStore.get.mockImplementation(() => {
      throw new Error('cookies indisponibles');
    });

    await expect(changePhaseStatusAction(4, 12, 'done')).rejects.toThrow(
      'cookies indisponibles'
    );
  });
});

describe('changePhaseHoursAction', () => {
  const INITIAL = { value: '0.00' };

  it('envoie les heures réelles en chaîne décimale, puis revient à la fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(
      changePhaseHoursAction(4, 12, INITIAL, form({ actualHours: '7,5' }))
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites/4/phases/12');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({ actualHours: '7.5' });
  });

  it.each(['', '-1', '10000', '1.234', 'abc'])(
    'refuse %j sans appeler l’API, et garde la saisie',
    async (hours) => {
      const state = await changePhaseHoursAction(
        4,
        12,
        INITIAL,
        form({ actualHours: hours })
      );

      expect(state.message).toBe(HOURS_MESSAGE);
      expect(state.value).toBe(hours);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('accepte zéro heure', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(
      changePhaseHoursAction(4, 12, INITIAL, form({ actualHours: '0' }))
    ).rejects.toThrow('NEXT_REDIRECT /chantiers/4');
  });

  it('explique que l’avancement n’est plus modifiable (409) et garde la saisie', async () => {
    fetchMock.mockResolvedValue(
      apiError(
        409,
        'CONFLICT',
        undefined,
        'Phase progress can only be changed while the worksite is in production'
      )
    );

    expect(
      await changePhaseHoursAction(4, 12, INITIAL, form({ actualHours: '3' }))
    ).toEqual({ message: PROGRESS_LOCKED_MESSAGE, value: '3' });
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(
      changePhaseHoursAction(4, 12, INITIAL, form({ actualHours: '3' }))
    ).rejects.toThrow('NEXT_REDIRECT /connexion?session=expiree');
  });
});

describe('movePhaseAction', () => {
  it('envoie l’ordre complet puis revient à la fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 4 } }));

    await expect(movePhaseAction(4, [12, 11, 13])).rejects.toThrow(
      'NEXT_REDIRECT /chantiers/4'
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/worksites/4/phases/order');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ phaseIds: [12, 11, 13] });
  });

  it.each([400, 404, 409])(
    'revient à la fiche, qui montre la situation réelle, après un refus %i',
    async (status) => {
      fetchMock.mockResolvedValue(apiError(status, 'X'));

      await expect(movePhaseAction(4, [12, 11])).rejects.toThrow(
        'NEXT_REDIRECT /chantiers/4'
      );
    }
  );

  it('relance les autres erreurs de l’API', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    await expect(movePhaseAction(4, [12, 11])).rejects.toMatchObject({
      status: 500,
    });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(movePhaseAction(4, [12, 11])).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });
});
