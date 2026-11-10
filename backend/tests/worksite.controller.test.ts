import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { QuoteStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { ACCOUNTS, login, send } from './helpers/api.js';

interface Phase {
  id: number;
  position: number;
  name: string;
  status: string;
  estimatedHours: string;
  actualHours: string;
  assignee: { id: number; firstName: string } | null;
}

interface WorksiteDetail {
  id: number;
  reference: string;
  title: string;
  siteAddress: string | null;
  status: string;
  dueDate: string | null;
  client: { code: string; address: string | null };
  quote: { id: number; reference: string };
  phases: Phase[];
  totals: { estimatedHours: string; actualHours: string };
}

interface WorksiteResult {
  data: WorksiteDetail;
}

interface ListResult {
  data: {
    id: number;
    reference: string;
    status: string;
    progress: { done: number; total: number };
  }[];
  meta: { total: number };
}

interface ErrorResult {
  error: { code: string; message: string };
}

describe('Chantiers', () => {
  let martin: string;
  let dubois: string;
  let sequence = 0;

  // Devis créé directement en base : ces tests portent sur les chantiers.
  const createQuote = async (
    status: QuoteStatus = 'accepted',
    workshopName = 'Atelier Martin'
  ) => {
    const workshop = await prisma.workshop.findUniqueOrThrow({
      where: { name: workshopName },
    });
    const client = await prisma.client.findFirstOrThrow({
      where: { workshopId: workshop.id, code: 'CLI-0001' },
    });
    sequence += 1;

    return prisma.quote.create({
      data: {
        workshopId: workshop.id,
        clientId: client.id,
        reference: `TST-${Date.now()}-${sequence}`,
        title: `Chantier test ${Date.now()}-${sequence}`,
        description: 'Devis créé pour un test',
        status,
        lines: {
          create: [
            {
              position: 1,
              type: 'labor',
              label: 'Fabrication',
              quantity: 1,
              unit: 'h',
              unitPrice: 45,
              vatRate: 20,
            },
          ],
        },
      },
      select: { id: true, title: true },
    });
  };

  const createWorksite = (quoteId: number, token = martin, extra = {}) =>
    send<WorksiteResult>('POST', '/api/worksites', {
      token,
      body: { quoteId, ...extra },
    });

  const newWorksite = async () => {
    const quote = await createQuote();
    const { status, body } = await createWorksite(quote.id);
    assert.equal(status, 201);
    return body.data;
  };

  const getWorksite = (id: number, token = martin) =>
    send<WorksiteResult>('GET', `/api/worksites/${id}`, { token });

  const setStatus = (id: number, status: string, token = martin) =>
    send<WorksiteResult & ErrorResult>('PATCH', `/api/worksites/${id}/status`, {
      token,
      body: { status },
    });

  const patchPhase = (
    worksiteId: number,
    phaseId: number,
    body: unknown,
    token = martin
  ) =>
    send<WorksiteResult & ErrorResult>(
      'PATCH',
      `/api/worksites/${worksiteId}/phases/${phaseId}`,
      { token, body }
    );

  const addPhase = (worksiteId: number, body: unknown, token = martin) =>
    send<WorksiteResult & ErrorResult>(
      'POST',
      `/api/worksites/${worksiteId}/phases`,
      { token, body }
    );

  const completeAllPhases = async (worksite: WorksiteDetail) => {
    for (const phase of worksite.phases) {
      assert.equal(
        (await patchPhase(worksite.id, phase.id, { status: 'in_progress' }))
          .status,
        200
      );
      assert.equal(
        (await patchPhase(worksite.id, phase.id, { status: 'done' })).status,
        200
      );
    }
  };

  // Chantier du jeu d'essai, retrouvé par sa référence.
  const seededWorksite = async (reference: string) => {
    const list = await send<ListResult>(
      'GET',
      `/api/worksites?search=${reference}`,
      { token: martin }
    );
    return (await getWorksite(list.body.data[0].id)).body.data;
  };

  before(async () => {
    martin = await login(ACCOUNTS.martinMember);
    dubois = await login(ACCOUNTS.duboisAdmin);
  });

  describe('accès', () => {
    it('refuse une requête sans jeton (401)', async () => {
      const { status } = await send('GET', '/api/worksites');
      assert.equal(status, 401);
    });
  });

  describe('POST /api/worksites', () => {
    it('crée un chantier depuis un devis accepté', async () => {
      const quote = await createQuote();
      const { status, body } = await createWorksite(quote.id);
      const worksite = body.data;

      assert.equal(status, 201);
      assert.match(worksite.reference, /^CH-\d{4}-\d{4}$/);
      assert.equal(worksite.status, 'pending');
      assert.equal(worksite.title, quote.title);
      assert.equal(worksite.client.code, 'CLI-0001');
      assert.equal(worksite.quote.id, quote.id);
      assert.deepEqual(
        worksite.phases.map((phase) => phase.name),
        ['Débit', 'Usinage', 'Assemblage', 'Finition', 'Livraison ou pose']
      );
      assert.deepEqual(
        worksite.phases.map((phase) => phase.position),
        [1, 2, 3, 4, 5]
      );
      assert.ok(worksite.phases.every((phase) => phase.status === 'todo'));
      assert.deepEqual(worksite.totals, {
        estimatedHours: '0.00',
        actualHours: '0.00',
      });
    });

    it('renvoie le chantier existant à la seconde demande (200)', async () => {
      const quote = await createQuote();
      const first = await createWorksite(quote.id);
      const second = await createWorksite(quote.id);

      assert.equal(first.status, 201);
      assert.equal(second.status, 200);
      assert.equal(second.body.data.id, first.body.data.id);
    });

    it('ne crée qu’un chantier pour deux demandes simultanées', async () => {
      const quote = await createQuote();
      const results = await Promise.all([
        createWorksite(quote.id),
        createWorksite(quote.id),
      ]);

      const statuses = results.map((result) => result.status).sort();
      assert.deepEqual(statuses, [200, 201]);
      assert.equal(results[0].body.data.id, results[1].body.data.id);

      const count = await prisma.worksite.count({
        where: { quoteId: quote.id },
      });
      assert.equal(count, 1);
    });

    it('accepte une échéance et une adresse de chantier à la création', async () => {
      const quote = await createQuote();
      const { status, body } = await createWorksite(quote.id, martin, {
        dueDate: '2027-03-15',
        siteAddress: '5 rue du Chantier, 01100 Oyonnax',
      });

      assert.equal(status, 201);
      assert.equal(body.data.dueDate, '2027-03-15');
      assert.equal(body.data.siteAddress, '5 rue du Chantier, 01100 Oyonnax');
    });

    it('refuse un devis qui n’est pas accepté (409)', async () => {
      const quote = await createQuote('sent');
      const { status, body } = await send<ErrorResult>(
        'POST',
        '/api/worksites',
        { token: martin, body: { quoteId: quote.id } }
      );

      assert.equal(status, 409);
      assert.equal(body.error.code, 'CONFLICT');
    });

    it('refuse le devis d’un autre atelier (404)', async () => {
      const quote = await createQuote();
      const { status } = await createWorksite(quote.id, dubois);
      assert.equal(status, 404);
    });
  });

  describe('consultation', () => {
    it('filtre la liste par statut et par recherche', async () => {
      // Les tests créent des chantiers à chaque exécution : on filtre aussi par
      // référence pour retrouver ceux du jeu d'essai, quel que soit le nombre de pages.
      const delivered = await send<ListResult>(
        'GET',
        '/api/worksites?status=delivered&limit=100',
        { token: martin }
      );
      assert.ok(
        delivered.body.data.every((worksite) => worksite.status === 'delivered')
      );

      const seeded = await send<ListResult>(
        'GET',
        '/api/worksites?status=delivered&search=CH-2026-0002',
        { token: martin }
      );
      assert.equal(seeded.body.meta.total, 1);
      assert.equal(seeded.body.data[0].reference, 'CH-2026-0002');

      const search = await send<ListResult>(
        'GET',
        '/api/worksites?search=CH-2026-0001',
        { token: martin }
      );
      assert.equal(search.body.meta.total, 1);
      assert.deepEqual(search.body.data[0].progress, { done: 2, total: 5 });
    });

    it('renvoie le détail du chantier du jeu d’essai, avec les totaux d’heures', async () => {
      const worksite = await seededWorksite('CH-2026-0001');

      assert.equal(worksite.status, 'in_production');
      assert.equal(worksite.quote.reference, 'DEV-2026-0001');
      assert.equal(worksite.dueDate, '2026-12-15');
      assert.equal(worksite.phases.length, 5);
      assert.equal(worksite.phases[2].assignee?.firstName, 'Sophie');
      assert.deepEqual(worksite.totals, {
        estimatedHours: '34.00',
        actualHours: '18.50',
      });
    });

    it('renvoie 404 sur le détail d’un chantier d’un autre atelier', async () => {
      const worksite = await newWorksite();
      const { status } = await getWorksite(worksite.id, dubois);
      assert.equal(status, 404);
    });
  });

  describe('PATCH /api/worksites/:id', () => {
    it('modifie l’échéance et l’adresse, puis efface l’adresse', async () => {
      const worksite = await newWorksite();

      const updated = await send<WorksiteResult>(
        'PATCH',
        `/api/worksites/${worksite.id}`,
        {
          token: martin,
          body: { dueDate: '2027-01-20', siteAddress: '8 impasse des Lilas' },
        }
      );
      assert.equal(updated.status, 200);
      assert.equal(updated.body.data.dueDate, '2027-01-20');
      assert.equal(updated.body.data.siteAddress, '8 impasse des Lilas');

      const cleared = await send<WorksiteResult>(
        'PATCH',
        `/api/worksites/${worksite.id}`,
        { token: martin, body: { siteAddress: null } }
      );
      assert.equal(cleared.body.data.siteAddress, null);
      assert.equal(cleared.body.data.dueDate, '2027-01-20');
    });

    it('refuse de modifier un chantier livré (409)', async () => {
      const delivered = await seededWorksite('CH-2026-0002');
      const { status } = await send('PATCH', `/api/worksites/${delivered.id}`, {
        token: martin,
        body: { title: 'Trop tard' },
      });

      assert.equal(status, 409);
    });
  });

  describe('statuts', () => {
    it('fait avancer un chantier jusqu’à la livraison', async () => {
      const worksite = await newWorksite();

      const started = await setStatus(worksite.id, 'in_production');
      assert.equal(started.status, 200);
      assert.equal(started.body.data.status, 'in_production');

      await completeAllPhases(worksite);

      const ready = await setStatus(worksite.id, 'ready');
      assert.equal(ready.status, 200);
      assert.equal(ready.body.data.status, 'ready');

      const delivered = await setStatus(worksite.id, 'delivered');
      assert.equal(delivered.status, 200);
      assert.equal(delivered.body.data.status, 'delivered');
    });

    it('refuse le passage à ready tant qu’une phase n’est pas terminée (409)', async () => {
      const worksite = await newWorksite();
      await setStatus(worksite.id, 'in_production');
      await patchPhase(worksite.id, worksite.phases[0].id, {
        status: 'in_progress',
      });
      await patchPhase(worksite.id, worksite.phases[0].id, { status: 'done' });

      const { status, body } = await setStatus(worksite.id, 'ready');

      assert.equal(status, 409);
      assert.equal(body.error.code, 'CONFLICT');
      // Le refus annule tout : le chantier reste en production.
      assert.equal(
        (await getWorksite(worksite.id)).body.data.status,
        'in_production'
      );
    });

    it('refuse de sauter une étape (409)', async () => {
      const worksite = await newWorksite();

      assert.equal((await setStatus(worksite.id, 'ready')).status, 409);
      assert.equal((await setStatus(worksite.id, 'delivered')).status, 409);
    });

    it('annule un chantier non livré', async () => {
      const worksite = await newWorksite();

      const canceled = await setStatus(worksite.id, 'canceled');
      assert.equal(canceled.status, 200);
      assert.equal(canceled.body.data.status, 'canceled');

      // Un chantier annulé est figé.
      const blocked = await addPhase(worksite.id, { name: 'Trop tard' });
      assert.equal(blocked.status, 409);
    });

    it('refuse d’annuler un chantier livré (409)', async () => {
      const delivered = await seededWorksite('CH-2026-0002');
      const { status } = await setStatus(delivered.id, 'canceled');
      assert.equal(status, 409);
    });

    it('refuse de changer le statut d’un autre atelier (404)', async () => {
      const worksite = await newWorksite();
      const { status } = await setStatus(worksite.id, 'in_production', dubois);
      assert.equal(status, 404);
    });
  });

  describe('phases', () => {
    it('ajoute une phase en fin de liste', async () => {
      const worksite = await newWorksite();
      const { status, body } = await addPhase(worksite.id, {
        name: 'Contrôle qualité',
        estimatedHours: 2.5,
      });

      assert.equal(status, 201);
      assert.equal(body.data.phases.length, 6);
      const added = body.data.phases[5];
      assert.equal(added.name, 'Contrôle qualité');
      assert.equal(added.position, 6);
      assert.equal(added.estimatedHours, '2.50');
      assert.equal(body.data.totals.estimatedHours, '2.50');
    });

    it('donne des positions distinctes à des ajouts simultanés', async () => {
      const worksite = await newWorksite();
      const results = await Promise.all(
        [1, 2, 3].map((index) =>
          addPhase(worksite.id, { name: `Phase ${index}` })
        )
      );

      assert.ok(results.every((result) => result.status === 201));
      const { body } = await getWorksite(worksite.id);
      const positions = body.data.phases.map((phase) => phase.position);
      assert.deepEqual(positions, [1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('modifie le nom et l’estimation d’une phase', async () => {
      const worksite = await newWorksite();
      const { status, body } = await patchPhase(
        worksite.id,
        worksite.phases[0].id,
        { name: 'Débit des panneaux', estimatedHours: '3' }
      );

      assert.equal(status, 200);
      assert.equal(body.data.phases[0].name, 'Débit des panneaux');
      assert.equal(body.data.phases[0].estimatedHours, '3.00');
      assert.equal(body.data.totals.estimatedHours, '3.00');
    });

    it('refuse de changer l’avancement avant le démarrage (409)', async () => {
      const worksite = await newWorksite();
      const { status } = await patchPhase(worksite.id, worksite.phases[0].id, {
        status: 'in_progress',
      });

      assert.equal(status, 409);
    });

    it('suit l’avancement d’une phase et rouvre une phase terminée', async () => {
      const worksite = await newWorksite();
      await setStatus(worksite.id, 'in_production');
      const phaseId = worksite.phases[0].id;

      const started = await patchPhase(worksite.id, phaseId, {
        status: 'in_progress',
        actualHours: 1.5,
      });
      assert.equal(started.status, 200);
      assert.equal(started.body.data.phases[0].status, 'in_progress');
      assert.equal(started.body.data.phases[0].actualHours, '1.50');

      const done = await patchPhase(worksite.id, phaseId, { status: 'done' });
      assert.equal(done.body.data.phases[0].status, 'done');

      const reopened = await patchPhase(worksite.id, phaseId, {
        status: 'in_progress',
      });
      assert.equal(reopened.status, 200);
      assert.equal(reopened.body.data.phases[0].status, 'in_progress');
      assert.equal(reopened.body.data.totals.actualHours, '1.50');
    });

    it('refuse de passer une phase de todo à done (409)', async () => {
      const worksite = await newWorksite();
      await setStatus(worksite.id, 'in_production');

      const { status, body } = await patchPhase(
        worksite.id,
        worksite.phases[0].id,
        { status: 'done' }
      );

      assert.equal(status, 409);
      assert.equal(body.error.code, 'CONFLICT');
    });

    it('refuse de rouvrir une phase quand le chantier est prêt (409)', async () => {
      const worksite = await newWorksite();
      await setStatus(worksite.id, 'in_production');
      await completeAllPhases(worksite);
      await setStatus(worksite.id, 'ready');

      const reopen = await patchPhase(worksite.id, worksite.phases[0].id, {
        status: 'in_progress',
      });
      assert.equal(reopen.status, 409);

      const hours = await patchPhase(worksite.id, worksite.phases[0].id, {
        actualHours: 2,
      });
      assert.equal(hours.status, 409);
    });

    it('affecte une phase à un membre de l’atelier', async () => {
      const worksite = await newWorksite();
      const member = await prisma.user.findUniqueOrThrow({
        where: { email: ACCOUNTS.martinMember.email },
      });

      const assigned = await patchPhase(worksite.id, worksite.phases[0].id, {
        assigneeId: member.id,
      });
      assert.equal(assigned.status, 200);
      assert.equal(assigned.body.data.phases[0].assignee?.firstName, 'Sophie');

      const cleared = await patchPhase(worksite.id, worksite.phases[0].id, {
        assigneeId: null,
      });
      assert.equal(cleared.body.data.phases[0].assignee, null);
    });

    it('refuse d’affecter un utilisateur d’un autre atelier (404)', async () => {
      const worksite = await newWorksite();
      const outsider = await prisma.user.findUniqueOrThrow({
        where: { email: ACCOUNTS.duboisAdmin.email },
      });

      const { status } = await patchPhase(worksite.id, worksite.phases[0].id, {
        assigneeId: outsider.id,
      });
      assert.equal(status, 404);
    });

    it('supprime une phase', async () => {
      const worksite = await newWorksite();
      const { status, body } = await send<WorksiteResult>(
        'DELETE',
        `/api/worksites/${worksite.id}/phases/${worksite.phases[4].id}`,
        { token: martin }
      );

      assert.equal(status, 200);
      assert.equal(body.data.phases.length, 4);
    });

    it('refuse de supprimer une phase d’un chantier livré (409)', async () => {
      const delivered = await seededWorksite('CH-2026-0002');
      const { status } = await send(
        'DELETE',
        `/api/worksites/${delivered.id}/phases/${delivered.phases[0].id}`,
        { token: martin }
      );

      assert.equal(status, 409);
    });

    it('réordonne les phases', async () => {
      const worksite = await newWorksite();
      const reversed = worksite.phases.map((phase) => phase.id).reverse();

      const { status, body } = await send<WorksiteResult>(
        'PUT',
        `/api/worksites/${worksite.id}/phases/order`,
        { token: martin, body: { phaseIds: reversed } }
      );

      assert.equal(status, 200);
      assert.deepEqual(
        body.data.phases.map((phase) => phase.id),
        reversed
      );
      assert.deepEqual(
        body.data.phases.map((phase) => phase.position),
        [1, 2, 3, 4, 5]
      );
      assert.equal(body.data.phases[0].name, 'Livraison ou pose');
    });

    it('refuse un ordre incomplet (400)', async () => {
      const worksite = await newWorksite();
      const { status, body } = await send<ErrorResult>(
        'PUT',
        `/api/worksites/${worksite.id}/phases/order`,
        {
          token: martin,
          body: { phaseIds: worksite.phases.slice(0, 2).map((p) => p.id) },
        }
      );

      assert.equal(status, 400);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    it('refuse de modifier les phases d’un autre atelier (404)', async () => {
      const worksite = await newWorksite();

      const added = await addPhase(worksite.id, { name: 'Piratage' }, dubois);
      assert.equal(added.status, 404);

      const reordered = await send(
        'PUT',
        `/api/worksites/${worksite.id}/phases/order`,
        {
          token: dubois,
          body: { phaseIds: worksite.phases.map((phase) => phase.id) },
        }
      );
      assert.equal(reordered.status, 404);
    });
  });
});
