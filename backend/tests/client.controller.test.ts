import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNTS, login, send } from './helpers/api.js';

interface Client {
  id: number;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ClientDetail extends Client {
  quotes: { reference: string }[];
  worksites: { reference: string }[];
}

interface ListBody {
  data: Client[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

interface ErrorBody {
  error: { code: string; message: string };
}

describe('Clients', () => {
  const suffix = Date.now();
  let martin: string;
  let dubois: string;
  let durandId: number;

  const search = (term: string) =>
    `/api/clients?search=${encodeURIComponent(term)}`;

  before(async () => {
    martin = await login(ACCOUNTS.martinMember);
    dubois = await login(ACCOUNTS.duboisAdmin);

    const list = await send<ListBody>('GET', search('Famille Durand'), {
      token: martin,
    });
    durandId = list.body.data[0].id;
  });

  describe('accès', () => {
    it('refuse une requête sans jeton (401)', async () => {
      const { status } = await send('GET', '/api/clients');
      assert.equal(status, 401);
    });
  });

  describe('POST /api/clients', () => {
    it('crée un client avec un code généré', async () => {
      const { status, body } = await send<{ data: Client }>(
        'POST',
        '/api/clients',
        {
          token: martin,
          body: {
            name: `Client test ${suffix}`,
            email: 'TEST@Example.test',
            phone: '04 74 00 00 99',
          },
        }
      );

      assert.equal(status, 201);
      assert.match(body.data.code, /^CLI-\d{4}$/);
      // L'e-mail est normalisé en minuscules.
      assert.equal(body.data.email, 'test@example.test');
    });

    it('attribue des codes distincts à des créations simultanées', async () => {
      const results = await Promise.all(
        Array.from({ length: 4 }, (_, index) =>
          send<{ data: Client }>('POST', '/api/clients', {
            token: martin,
            body: { name: `Client parallèle ${suffix}-${index}` },
          })
        )
      );

      assert.ok(results.every((result) => result.status === 201));
      const codes = results.map((result) => result.body.data.code);
      assert.equal(new Set(codes).size, codes.length);
    });

    it('refuse un client sans nom (400)', async () => {
      const { status, body } = await send<ErrorBody>('POST', '/api/clients', {
        token: martin,
        body: {},
      });

      assert.equal(status, 400);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    it('refuse un e-mail invalide (400)', async () => {
      const { status } = await send('POST', '/api/clients', {
        token: martin,
        body: { name: 'Client e-mail invalide', email: 'pas-un-email' },
      });

      assert.equal(status, 400);
    });
  });

  describe('GET /api/clients', () => {
    it('cherche par nom, sans tenir compte de la casse', async () => {
      const { status, body } = await send<ListBody>('GET', search('DURAND'), {
        token: martin,
      });

      assert.equal(status, 200);
      assert.equal(body.meta.total, 1);
      assert.equal(body.data[0].name, 'Famille Durand');
    });

    it('pagine les résultats', async () => {
      const { body } = await send<ListBody>('GET', '/api/clients?limit=2', {
        token: martin,
      });

      assert.equal(body.data.length, 2);
      assert.equal(body.meta.limit, 2);
      assert.ok(body.meta.total >= 3);
      assert.equal(body.meta.totalPages, Math.ceil(body.meta.total / 2));
    });

    it('refuse une limite trop grande (400)', async () => {
      const { status } = await send('GET', '/api/clients?limit=1000', {
        token: martin,
      });

      assert.equal(status, 400);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('renvoie la fiche avec les devis et les chantiers', async () => {
      const { status, body } = await send<{ data: ClientDetail }>(
        'GET',
        `/api/clients/${durandId}`,
        { token: martin }
      );

      assert.equal(status, 200);
      assert.equal(body.data.code, 'CLI-0001');
      // D'autres tests créent des devis pour ce client : on vérifie la présence
      // des devis et du chantier du jeu d'essai, pas leur nombre exact.
      const quoteReferences = body.data.quotes.map((quote) => quote.reference);
      const worksiteReferences = body.data.worksites.map(
        (worksite) => worksite.reference
      );
      assert.ok(quoteReferences.includes('DEV-2026-0001'));
      assert.ok(quoteReferences.includes('DEV-2026-0004'));
      assert.ok(worksiteReferences.includes('CH-2026-0001'));
    });

    it('renvoie 404 pour un client inexistant', async () => {
      const { status } = await send('GET', '/api/clients/999999', {
        token: martin,
      });

      assert.equal(status, 404);
    });
  });

  describe('PATCH /api/clients/:id', () => {
    it('modifie les champs fournis et ignore le code', async () => {
      const created = await send<{ data: Client }>('POST', '/api/clients', {
        token: martin,
        body: { name: `Client à modifier ${suffix}`, phone: '01 00 00 00 00' },
      });
      const { id, code } = created.body.data;

      const { status, body } = await send<{ data: Client }>(
        'PATCH',
        `/api/clients/${id}`,
        { token: martin, body: { phone: null, code: 'CLI-9999' } }
      );

      assert.equal(status, 200);
      assert.equal(body.data.phone, null);
      assert.equal(body.data.code, code);
    });

    it('refuse un corps vide (400)', async () => {
      const { status } = await send('PATCH', `/api/clients/${durandId}`, {
        token: martin,
        body: {},
      });

      assert.equal(status, 400);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('supprime un client sans historique (204)', async () => {
      const created = await send<{ data: Client }>('POST', '/api/clients', {
        token: martin,
        body: { name: `Client à supprimer ${suffix}` },
      });
      const { id } = created.body.data;

      const deleted = await send('DELETE', `/api/clients/${id}`, {
        token: martin,
      });
      assert.equal(deleted.status, 204);

      const after = await send('GET', `/api/clients/${id}`, { token: martin });
      assert.equal(after.status, 404);
    });

    it('refuse de supprimer un client qui a des devis (409)', async () => {
      const { status, body } = await send<ErrorBody>(
        'DELETE',
        `/api/clients/${durandId}`,
        { token: martin }
      );

      assert.equal(status, 409);
      assert.equal(body.error.code, 'CONFLICT');
    });
  });

  describe('isolation entre ateliers', () => {
    it('ne liste pas les clients d’un autre atelier', async () => {
      const { body } = await send<ListBody>('GET', search('Durand'), {
        token: dubois,
      });

      assert.equal(body.meta.total, 0);
    });

    it('renvoie 404 sur la fiche d’un client d’un autre atelier', async () => {
      const { status } = await send('GET', `/api/clients/${durandId}`, {
        token: dubois,
      });

      assert.equal(status, 404);
    });

    it('refuse de modifier un client d’un autre atelier (404)', async () => {
      const { status } = await send('PATCH', `/api/clients/${durandId}`, {
        token: dubois,
        body: { name: 'Piraté' },
      });

      assert.equal(status, 404);
    });

    it('refuse de supprimer un client d’un autre atelier (404)', async () => {
      const { status } = await send('DELETE', `/api/clients/${durandId}`, {
        token: dubois,
      });

      assert.equal(status, 404);
    });
  });
});
