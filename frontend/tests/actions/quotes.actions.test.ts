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
  addLineAction,
  createQuoteAction,
  deleteLineAction,
  updateLineAction,
  updateQuoteAction,
} from '@/app/(app)/devis/actions';
import {
  DEFAULT_LINE_VALUES,
  LINE_FIELD_MESSAGES,
  lineInitialState,
} from '@/lib/line-form';
import {
  NOT_DRAFT_MESSAGE,
  QUOTE_FIELD_MESSAGES,
  quoteInitialState,
} from '@/lib/quote-form';

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

const LINE = {
  type: 'material',
  label: 'Chêne massif',
  quantity: '6',
  unit: 'm²',
  unitPrice: '180',
  vatRate: '20',
};

beforeEach(() => {
  vi.resetAllMocks();
  nav.redirect.mockImplementation((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  process.env.API_URL = 'http://api.test';
  cookieStore.get.mockReturnValue({ value: 'jeton-123' });
});

describe('createQuoteAction', () => {
  it('crée le brouillon, sans les champs vides, puis ouvre sa fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 12 } }, 201));

    await expect(
      createQuoteAction(
        quoteInitialState(),
        form({
          clientId: '3',
          title: '  Bibliothèque ',
          description: '',
          validUntil: '',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT /devis/12');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes');
    expect(options.method).toBe('POST');
    expect(new Headers(options.headers).get('Authorization')).toBe(
      'Bearer jeton-123'
    );
    expect(JSON.parse(options.body)).toEqual({
      clientId: 3,
      title: 'Bibliothèque',
    });
  });

  it('refuse l’absence de client sans appeler l’API, et garde la saisie', async () => {
    const state = await createQuoteAction(
      quoteInitialState(),
      form({ title: 'Bibliothèque', description: 'Chêne' })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.fieldErrors).toEqual({
      clientId: QUOTE_FIELD_MESSAGES.clientId,
    });
    expect(state.values.title).toBe('Bibliothèque');
    expect(state.values.description).toBe('Chêne');
  });

  it('affiche en français le champ que l’API refuse, et garde la saisie', async () => {
    fetchMock.mockResolvedValue(
      apiError(400, 'VALIDATION_ERROR', [
        { path: 'validUntil', message: 'Date in the past' },
      ])
    );

    const state = await createQuoteAction(
      quoteInitialState(),
      form({ clientId: '3', title: 'Bibliothèque', validUntil: '2020-01-01' })
    );

    expect(state.message).toBe(
      'Certaines informations sont invalides. Vérifiez les champs.'
    );
    expect(state.fieldErrors).toEqual({
      validUntil: QUOTE_FIELD_MESSAGES.validUntil,
    });
    expect(state.values.validUntil).toBe('2020-01-01');
  });

  it('signale un client inexistant', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    const state = await createQuoteAction(
      quoteInitialState(),
      form({ clientId: '999', title: 'Bibliothèque' })
    );

    expect(state.message).toBe('Ce client n’existe pas.');
  });

  it('affiche un message quand l’API est injoignable', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const state = await createQuoteAction(
      quoteInitialState(),
      form({ clientId: '3', title: 'Bibliothèque' })
    );

    expect(state.message).toContain('momentanément indisponible');
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(
      createQuoteAction(
        quoteInitialState(),
        form({ clientId: '3', title: 'Bibliothèque' })
      )
    ).rejects.toThrow('NEXT_REDIRECT /connexion?session=expiree');
  });
});

describe('updateQuoteAction', () => {
  it('modifie le brouillon, efface les champs vidés, puis revient à sa fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 5 } }));

    await expect(
      updateQuoteAction(
        5,
        quoteInitialState(),
        form({
          clientId: '3',
          title: 'Bibliothèque',
          description: '',
          validUntil: '2026-12-31',
        })
      )
    ).rejects.toThrow('NEXT_REDIRECT /devis/5');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({
      clientId: 3,
      title: 'Bibliothèque',
      description: null,
      validUntil: '2026-12-31',
    });
  });

  it('explique qu’un devis qui n’est plus un brouillon ne se modifie plus (409)', async () => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT'));

    const state = await updateQuoteAction(
      5,
      quoteInitialState(),
      form({ clientId: '3', title: 'Bibliothèque' })
    );

    expect(state.message).toBe(NOT_DRAFT_MESSAGE);
    expect(state.values.title).toBe('Bibliothèque');
  });
});

describe('addLineAction', () => {
  it('ajoute la ligne avec des nombres en chaînes décimales, puis revient à la fiche', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 5 } }, 201));

    await expect(
      addLineAction(
        5,
        lineInitialState(),
        form({ ...LINE, quantity: '2,5', unitPrice: '45,50' })
      )
    ).rejects.toThrow('NEXT_REDIRECT /devis/5');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5/lines');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      type: 'material',
      label: 'Chêne massif',
      quantity: '2.5',
      unit: 'm²',
      unitPrice: '45.50',
      vatRate: '20',
    });
  });

  it('refuse une quantité nulle sans appeler l’API, et garde la saisie', async () => {
    const state = await addLineAction(
      5,
      lineInitialState(),
      form({ ...LINE, quantity: '0' })
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.fieldErrors).toEqual({
      quantity: LINE_FIELD_MESSAGES.quantity,
    });
    expect(state.values.label).toBe('Chêne massif');
  });

  it('affiche en français le champ que l’API refuse', async () => {
    fetchMock.mockResolvedValue(
      apiError(400, 'VALIDATION_ERROR', [
        { path: 'unitPrice', message: 'Invalid' },
      ])
    );

    const state = await addLineAction(5, lineInitialState(), form(LINE));

    expect(state.fieldErrors).toEqual({
      unitPrice: LINE_FIELD_MESSAGES.unitPrice,
    });
  });

  it('explique qu’un devis qui n’est plus un brouillon ne reçoit plus de ligne (409)', async () => {
    fetchMock.mockResolvedValue(apiError(409, 'CONFLICT'));

    const state = await addLineAction(
      5,
      lineInitialState(DEFAULT_LINE_VALUES),
      form(LINE)
    );

    expect(state.message).toBe(NOT_DRAFT_MESSAGE);
  });
});

describe('updateLineAction', () => {
  it('modifie la ligne puis revient à la fiche du devis', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 5 } }));

    await expect(
      updateLineAction(5, 9, lineInitialState(), form(LINE))
    ).rejects.toThrow('NEXT_REDIRECT /devis/5');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5/lines/9');
    expect(options.method).toBe('PATCH');
  });

  it('signale une ligne ou un devis qui n’existe plus (404)', async () => {
    fetchMock.mockResolvedValue(apiError(404, 'NOT_FOUND'));

    const state = await updateLineAction(5, 9, lineInitialState(), form(LINE));

    expect(state.message).toBe('Ce devis ou cette ligne n’existe plus.');
  });
});

describe('deleteLineAction', () => {
  it('supprime la ligne puis revient à la fiche du devis', async () => {
    fetchMock.mockResolvedValue(json({ data: { id: 5 } }));

    await expect(deleteLineAction(5, 9)).rejects.toThrow(
      'NEXT_REDIRECT /devis/5'
    );

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/quotes/5/lines/9');
    expect(options.method).toBe('DELETE');
  });

  it('revient à la fiche, qui montre la situation réelle, si la ligne n’existe plus ou si le devis est figé', async () => {
    for (const status of [404, 409]) {
      fetchMock.mockResolvedValueOnce(apiError(status, 'X'));
      await expect(deleteLineAction(5, 9)).rejects.toThrow(
        'NEXT_REDIRECT /devis/5'
      );
    }
  });

  it('relance une vraie panne de l’API, au lieu de la cacher', async () => {
    fetchMock.mockResolvedValue(apiError(500, 'INTERNAL_ERROR'));

    await expect(deleteLineAction(5, 9)).rejects.toMatchObject({ status: 500 });
    expect(nav.redirect).not.toHaveBeenCalled();
  });

  it('renvoie vers la connexion quand la session a expiré', async () => {
    fetchMock.mockResolvedValue(apiError(401, 'UNAUTHORIZED'));

    await expect(deleteLineAction(5, 9)).rejects.toThrow(
      'NEXT_REDIRECT /connexion?session=expiree'
    );
  });
});
