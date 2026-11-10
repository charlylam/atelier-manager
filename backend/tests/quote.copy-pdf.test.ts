import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTS, API_URL, login, send } from './helpers/api.js';

interface Line {
  position: number;
  label: string;
}

interface QuoteDetail {
  id: number;
  reference: string;
  status: string;
  validUntil: string | null;
  client: { code: string };
  lines: Line[];
  totals: { totalExclTax: string; totalVat: string; totalInclTax: string };
}

interface QuoteResult {
  data: QuoteDetail;
}

interface ListResult {
  data: { id: number }[];
}

// Nombre de pages d'un PDF produit par PDFKit (une entrée /Type /Page par page).
const countPages = (pdf: string) =>
  (pdf.match(/\/Type \/Page\s/g) ?? []).length;

describe('Duplication et export PDF', () => {
  let martin: string;
  let dubois: string;
  let sourceId: number;

  const getQuote = (id: number) =>
    send<QuoteResult>('GET', `/api/quotes/${id}`, { token: martin });

  const duplicate = (id: number, token = martin) =>
    send<QuoteResult>('POST', `/api/quotes/${id}/duplicate`, { token });

  const fetchPdf = (id: number, token?: string) =>
    fetch(`${API_URL}/api/quotes/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  before(async () => {
    martin = await login(ACCOUNTS.martinMember);
    dubois = await login(ACCOUNTS.duboisAdmin);

    // Devis accepté du jeu d'essai (4 lignes).
    const list = await send<ListResult>(
      'GET',
      '/api/quotes?search=DEV-2026-0001',
      { token: martin }
    );
    sourceId = list.body.data[0].id;
  });

  describe('POST /api/quotes/:id/duplicate', () => {
    it('copie un devis accepté en nouveau brouillon', async () => {
      const source = (await getQuote(sourceId)).body.data;

      const { status, body } = await duplicate(sourceId);
      const copy = body.data;

      assert.equal(status, 201);
      assert.notEqual(copy.id, source.id);
      assert.notEqual(copy.reference, source.reference);
      assert.match(copy.reference, /^DEV-\d{4}-\d{4}$/);
      assert.equal(copy.status, 'draft');
      assert.equal(copy.validUntil, null);
      assert.equal(copy.client.code, source.client.code);
      assert.deepEqual(
        copy.lines.map((line) => line.label),
        source.lines.map((line) => line.label)
      );
      assert.deepEqual(copy.totals, source.totals);

      // Le devis d'origine n'est pas touché.
      const after = (await getQuote(sourceId)).body.data;
      assert.equal(after.status, 'accepted');
      assert.equal(after.reference, source.reference);
    });

    it('produit une copie modifiable', async () => {
      const copy = (await duplicate(sourceId)).body.data;

      const { status } = await send('POST', `/api/quotes/${copy.id}/lines`, {
        token: martin,
        body: {
          type: 'other',
          label: 'Ligne ajoutée',
          quantity: 1,
          unit: 'forfait',
          unitPrice: 10,
        },
      });

      assert.equal(status, 201);
    });

    it('attribue des références distinctes à des copies simultanées', async () => {
      const results = await Promise.all(
        [1, 2, 3].map(() => duplicate(sourceId))
      );

      assert.ok(results.every((result) => result.status === 201));
      const references = results.map((result) => result.body.data.reference);
      assert.equal(new Set(references).size, references.length);
    });

    it('renvoie 404 pour un devis d’un autre atelier', async () => {
      const { status } = await duplicate(sourceId, dubois);
      assert.equal(status, 404);
    });
  });

  describe('GET /api/quotes/:id/pdf', () => {
    it('renvoie le PDF du devis', async () => {
      const res = await fetchPdf(sourceId, martin);

      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type') ?? '', /^application\/pdf/);
      assert.match(
        res.headers.get('content-disposition') ?? '',
        /attachment; filename="DEV-2026-0001\.pdf"/
      );

      const pdf = Buffer.from(await res.arrayBuffer()).toString('latin1');
      assert.ok(pdf.startsWith('%PDF-'));
      assert.ok(pdf.trimEnd().endsWith('%%EOF'));
      assert.equal(countPages(pdf), 1);
    });

    it('répartit un long devis sur plusieurs pages', async () => {
      const copy = (await duplicate(sourceId)).body.data;

      for (let index = 1; index <= 40; index++) {
        const added = await send('POST', `/api/quotes/${copy.id}/lines`, {
          token: martin,
          body: {
            type: 'material',
            label: `Ligne supplémentaire ${index}`,
            quantity: 1,
            unit: 'u',
            unitPrice: 10,
          },
        });
        assert.equal(added.status, 201);
      }

      const res = await fetchPdf(copy.id, martin);
      assert.equal(res.status, 200);

      const pdf = Buffer.from(await res.arrayBuffer()).toString('latin1');
      assert.ok(countPages(pdf) >= 2);
    });

    it('refuse une requête sans jeton (401)', async () => {
      const res = await fetchPdf(sourceId);
      assert.equal(res.status, 401);
    });

    it('renvoie 404 pour un devis d’un autre atelier', async () => {
      const res = await fetchPdf(sourceId, dubois);
      assert.equal(res.status, 404);
    });
  });
});
