import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma.js';
import { ACCOUNTS, login, send } from './helpers/api.js';

interface Line {
  id: number;
  position: number;
  quantity: string;
  unitPrice: string;
  totalExclTax: string;
}

interface QuoteDetail {
  id: number;
  reference: string;
  title: string;
  status: string;
  validUntil: string | null;
  client: { id: number; code: string; name: string };
  lines: Line[];
  totals: { totalExclTax: string; totalVat: string; totalInclTax: string };
}

interface QuoteSummary {
  id: number;
  reference: string;
  title: string;
  status: string;
  totalInclTax: string;
}

interface ApiResult {
  data?: QuoteDetail;
  error?: { code: string; message: string };
}

interface ListResult {
  data: QuoteSummary[];
  meta: { total: number };
  error?: { code: string; message: string };
}

const MATERIAL = {
  type: 'material',
  label: 'Panneau de chêne',
  quantity: 2,
  unit: 'm²',
  unitPrice: 10.5,
  vatRate: 20,
};

// TVA à 20 % par défaut.
const LABOR = {
  type: 'labor',
  label: 'Fabrication',
  quantity: 1.5,
  unit: 'h',
  unitPrice: 45,
};

describe('Devis', () => {
  const suffix = Date.now();
  const title = `Devis test ${suffix}`;
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  let martin: string;
  let dubois: string;
  let durandId: number;
  let rouxId: number;

  const createDraft = async (overrides: Record<string, unknown> = {}) => {
    const res = await send<ApiResult>('POST', '/api/quotes', {
      token: martin,
      body: { clientId: durandId, title, ...overrides },
    });
    assert.equal(res.status, 201);
    return res.body.data!;
  };

  const addLine = (quoteId: number, body: unknown, token = martin) =>
    send<ApiResult>('POST', `/api/quotes/${quoteId}/lines`, { token, body });

  const setStatus = (quoteId: number, status: string, token = martin) =>
    send<ApiResult>('PATCH', `/api/quotes/${quoteId}/status`, {
      token,
      body: { status },
    });

  const getQuote = (quoteId: number, token = martin) =>
    send<ApiResult>('GET', `/api/quotes/${quoteId}`, { token });

  before(async () => {
    martin = await login(ACCOUNTS.martinMember);
    dubois = await login(ACCOUNTS.duboisAdmin);

    const durand = await send<{ data: { id: number }[] }>(
      'GET',
      '/api/clients?search=Durand',
      { token: martin }
    );
    durandId = durand.body.data[0].id;

    const roux = await send<{ data: { id: number }[] }>(
      'GET',
      '/api/clients?search=Roux',
      { token: dubois }
    );
    rouxId = roux.body.data[0].id;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  describe('accès', () => {
    it('refuse une requête sans jeton (401)', async () => {
      const { status } = await send('GET', '/api/quotes');
      assert.equal(status, 401);
    });
  });

  describe('POST /api/quotes', () => {
    it('crée un brouillon avec une référence générée', async () => {
      const draft = await createDraft({
        description: 'Devis de test',
        validUntil: tomorrow,
      });

      assert.match(draft.reference, /^DEV-\d{4}-\d{4}$/);
      assert.equal(draft.status, 'draft');
      assert.equal(draft.client.code, 'CLI-0001');
      assert.equal(draft.validUntil, tomorrow);
      assert.deepEqual(draft.lines, []);
      assert.equal(draft.totals.totalInclTax, '0.00');
    });

    it('refuse le client d’un autre atelier (404)', async () => {
      const { status } = await send('POST', '/api/quotes', {
        token: martin,
        body: { clientId: rouxId, title },
      });

      assert.equal(status, 404);
    });

    it('refuse une date de validité passée (400)', async () => {
      const { status, body } = await send<ApiResult>('POST', '/api/quotes', {
        token: martin,
        body: { clientId: durandId, title, validUntil: '2020-01-01' },
      });

      assert.equal(status, 400);
      assert.equal(body.error?.code, 'VALIDATION_ERROR');
    });

    it('refuse un devis sans titre (400)', async () => {
      const { status } = await send('POST', '/api/quotes', {
        token: martin,
        body: { clientId: durandId },
      });

      assert.equal(status, 400);
    });
  });

  describe('GET /api/quotes', () => {
    it('filtre par statut', async () => {
      // limit=100 : d'autres tests créent des devis acceptés à chaque exécution.
      const { status, body } = await send<ListResult>(
        'GET',
        '/api/quotes?status=accepted&limit=100',
        { token: martin }
      );

      assert.equal(status, 200);
      assert.ok(body.data.length >= 2);
      assert.ok(body.data.every((quote) => quote.status === 'accepted'));
    });

    it('retrouve les devis acceptés du jeu d’essai par leur référence', async () => {
      for (const reference of ['DEV-2026-0001', 'DEV-2026-0006']) {
        const { body } = await send<ListResult>(
          'GET',
          `/api/quotes?status=accepted&search=${reference}`,
          { token: martin }
        );

        assert.equal(body.meta.total, 1);
        assert.equal(body.data[0].reference, reference);
      }
    });

    it('cherche par référence', async () => {
      const { body } = await send<ListResult>(
        'GET',
        '/api/quotes?search=DEV-2026-0002',
        { token: martin }
      );

      assert.equal(body.meta.total, 1);
      assert.equal(body.data[0].title, 'Comptoir de vente en frêne');
    });

    it('refuse un statut inconnu (400)', async () => {
      const { status } = await send('GET', '/api/quotes?status=foo', {
        token: martin,
      });

      assert.equal(status, 400);
    });
  });

  describe('GET /api/quotes/:id', () => {
    it('renvoie le détail et les totaux du devis du jeu d’essai', async () => {
      const list = await send<ListResult>(
        'GET',
        '/api/quotes?search=DEV-2026-0001',
        { token: martin }
      );
      const { status, body } = await getQuote(list.body.data[0].id);

      assert.equal(status, 200);
      assert.equal(body.data?.status, 'accepted');
      assert.equal(body.data?.validUntil, '2026-12-31');
      assert.equal(body.data?.lines.length, 4);
      assert.equal(body.data?.lines[0].totalExclTax, '1080.00');
      // 1080 + 1080 + 85 + 180 = 2425 HT ; TVA 20 % par ligne = 485.
      assert.deepEqual(body.data?.totals, {
        totalExclTax: '2425.00',
        totalVat: '485.00',
        totalInclTax: '2910.00',
      });
    });

    it('renvoie 404 pour un devis inexistant', async () => {
      const { status } = await getQuote(999999);
      assert.equal(status, 404);
    });
  });

  describe('PATCH /api/quotes/:id', () => {
    it('modifie un brouillon', async () => {
      const draft = await createDraft();

      const { status, body } = await send<ApiResult>(
        'PATCH',
        `/api/quotes/${draft.id}`,
        { token: martin, body: { title: 'Titre modifié', validUntil: null } }
      );

      assert.equal(status, 200);
      assert.equal(body.data?.title, 'Titre modifié');
      assert.equal(body.data?.validUntil, null);
    });

    it('refuse de modifier un devis envoyé (409)', async () => {
      const draft = await createDraft();
      await addLine(draft.id, MATERIAL);
      await setStatus(draft.id, 'sent');

      const { status, body } = await send<ApiResult>(
        'PATCH',
        `/api/quotes/${draft.id}`,
        { token: martin, body: { title: 'Trop tard' } }
      );

      assert.equal(status, 409);
      assert.equal(body.error?.code, 'CONFLICT');
    });
  });

  describe('lignes', () => {
    it('ajoute des lignes et calcule les totaux', async () => {
      const draft = await createDraft();
      await addLine(draft.id, MATERIAL);
      const { status, body } = await addLine(draft.id, LABOR);

      assert.equal(status, 201);
      assert.equal(body.data?.lines.length, 2);
      assert.deepEqual(
        body.data?.lines.map((line) => line.position),
        [1, 2]
      );
      // HT : 21,00 + 67,50 = 88,50 ; TVA : 4,20 + 13,50 = 17,70.
      assert.deepEqual(body.data?.totals, {
        totalExclTax: '88.50',
        totalVat: '17.70',
        totalInclTax: '106.20',
      });
    });

    it('modifie une ligne', async () => {
      const draft = await createDraft();
      await addLine(draft.id, MATERIAL);
      const withLabor = await addLine(draft.id, LABOR);
      const materialId = withLabor.body.data!.lines[0].id;

      const { status, body } = await send<ApiResult>(
        'PATCH',
        `/api/quotes/${draft.id}/lines/${materialId}`,
        { token: martin, body: { quantity: 3 } }
      );

      assert.equal(status, 200);
      // 3 × 10,50 = 31,50 ; HT 99,00 ; TVA 6,30 + 13,50 = 19,80.
      assert.deepEqual(body.data?.totals, {
        totalExclTax: '99.00',
        totalVat: '19.80',
        totalInclTax: '118.80',
      });
    });

    it('supprime une ligne', async () => {
      const draft = await createDraft();
      await addLine(draft.id, MATERIAL);
      const withLabor = await addLine(draft.id, LABOR);
      const laborId = withLabor.body.data!.lines[1].id;

      const { status, body } = await send<ApiResult>(
        'DELETE',
        `/api/quotes/${draft.id}/lines/${laborId}`,
        { token: martin }
      );

      assert.equal(status, 200);
      assert.equal(body.data?.lines.length, 1);
      assert.equal(body.data?.totals.totalInclTax, '25.20');
    });

    it('refuse un prix à trois décimales (400)', async () => {
      const draft = await createDraft();
      const { status } = await addLine(draft.id, {
        ...MATERIAL,
        unitPrice: '10.505',
      });

      assert.equal(status, 400);
    });

    it('refuse une quantité à zéro (400)', async () => {
      const draft = await createDraft();
      const { status } = await addLine(draft.id, { ...MATERIAL, quantity: 0 });

      assert.equal(status, 400);
    });

    it('donne des positions distinctes à des ajouts simultanés', async () => {
      const draft = await createDraft();

      const results = await Promise.all(
        [1, 2, 3].map(() => addLine(draft.id, MATERIAL))
      );
      assert.ok(results.every((result) => result.status === 201));

      const { body } = await getQuote(draft.id);
      assert.deepEqual(
        body.data?.lines.map((line) => line.position),
        [1, 2, 3]
      );
    });

    it('renvoie 404 pour une ligne inconnue', async () => {
      const draft = await createDraft();
      const { status } = await send(
        'PATCH',
        `/api/quotes/${draft.id}/lines/999999`,
        { token: martin, body: { quantity: 1 } }
      );

      assert.equal(status, 404);
    });
  });

  describe('statuts', () => {
    it('refuse d’envoyer un devis sans ligne (409)', async () => {
      const draft = await createDraft();
      const { status, body } = await setStatus(draft.id, 'sent');

      assert.equal(status, 409);
      assert.equal(body.error?.code, 'CONFLICT');

      // Le refus annule tout : le devis reste un brouillon.
      assert.equal((await getQuote(draft.id)).body.data?.status, 'draft');
    });

    it('envoie un devis, puis le fige', async () => {
      const draft = await createDraft();
      const withLine = await addLine(draft.id, MATERIAL);
      const lineId = withLine.body.data!.lines[0].id;

      const sent = await setStatus(draft.id, 'sent');
      assert.equal(sent.status, 200);
      assert.equal(sent.body.data?.status, 'sent');

      const edit = await send(
        'PATCH',
        `/api/quotes/${draft.id}/lines/${lineId}`,
        { token: martin, body: { quantity: 5 } }
      );
      assert.equal(edit.status, 409);

      const add = await addLine(draft.id, LABOR);
      assert.equal(add.status, 409);
    });

    it('accepte un devis envoyé', async () => {
      const draft = await createDraft();
      await addLine(draft.id, MATERIAL);
      await setStatus(draft.id, 'sent');

      const { status, body } = await setStatus(draft.id, 'accepted');

      assert.equal(status, 200);
      assert.equal(body.data?.status, 'accepted');
    });

    it('refuse de modifier le statut d’un devis accepté (409)', async () => {
      const draft = await createDraft();
      await addLine(draft.id, MATERIAL);
      await setStatus(draft.id, 'sent');
      await setStatus(draft.id, 'accepted');

      const { status } = await setStatus(draft.id, 'rejected');

      assert.equal(status, 409);
    });

    it('refuse d’accepter un brouillon (409)', async () => {
      const draft = await createDraft();
      const { status } = await setStatus(draft.id, 'accepted');

      assert.equal(status, 409);
    });

    it('passe un devis envoyé à expired quand sa date est dépassée', async () => {
      const draft = await createDraft({ validUntil: tomorrow });
      await addLine(draft.id, MATERIAL);
      const sent = await setStatus(draft.id, 'sent');
      assert.equal(sent.status, 200);

      // On recule la date en base : l'expiration est vérifiée à la consultation.
      await prisma.quote.update({
        where: { id: draft.id },
        data: { validUntil: new Date(Date.now() - 2 * 86_400_000) },
      });

      const accept = await setStatus(draft.id, 'accepted');
      assert.equal(accept.status, 409);

      const detail = await getQuote(draft.id);
      assert.equal(detail.body.data?.status, 'expired');
    });
  });

  describe('isolation entre ateliers', () => {
    let quoteId: number;

    before(async () => {
      quoteId = (await createDraft()).id;
    });

    it('renvoie 404 sur le détail d’un devis d’un autre atelier', async () => {
      const { status } = await getQuote(quoteId, dubois);
      assert.equal(status, 404);
    });

    it('refuse de modifier un devis d’un autre atelier (404)', async () => {
      const { status } = await send('PATCH', `/api/quotes/${quoteId}`, {
        token: dubois,
        body: { title: 'Piraté' },
      });

      assert.equal(status, 404);
    });

    it('refuse de changer le statut d’un autre atelier (404)', async () => {
      const { status } = await setStatus(quoteId, 'sent', dubois);
      assert.equal(status, 404);
    });

    it('refuse d’ajouter une ligne dans un autre atelier (404)', async () => {
      const { status } = await addLine(quoteId, MATERIAL, dubois);
      assert.equal(status, 404);
    });

    it('ne liste pas les devis d’un autre atelier', async () => {
      const { body } = await send<ListResult>(
        'GET',
        `/api/quotes?search=${encodeURIComponent(title)}`,
        { token: dubois }
      );

      assert.equal(body.meta.total, 0);
    });
  });
});
