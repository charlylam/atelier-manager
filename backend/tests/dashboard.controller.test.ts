import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { QuoteStatus, WorksiteStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma.js';
import { ACCOUNTS, login, send } from './helpers/api.js';

interface Dashboard {
  worksites: {
    byStatus: Record<string, number>;
    late: {
      total: number;
      items: {
        id: number;
        reference: string;
        status: string;
        dueDate: string;
        daysLate: number;
        client: { code: string };
      }[];
    };
  };
  quotes: {
    byStatus: Record<string, number>;
    pending: { count: number; totalInclTax: string };
  };
  revenue: {
    month: string;
    deliveredWorksites: number;
    totalExclTax: string;
    totalVat: string;
    totalInclTax: string;
  };
}

interface ListResult {
  meta: { total: number };
}

interface ErrorResult {
  error: { code: string };
}

const PAST = new Date('2020-01-01T00:00:00.000Z');
const FUTURE = new Date('2099-01-01T00:00:00.000Z');

// 3 × 100 € HT = 300 € HT, 360 € TTC avec une TVA à 20 %.
const LINES = [
  {
    position: 1,
    type: 'material' as const,
    label: 'Matériau',
    quantity: 3,
    unit: 'u',
    unitPrice: 100,
    vatRate: 20,
  },
];

// Écart entre deux montants "123.45", en centimes (évite les erreurs de flottants).
const cents = (after: string, before: string) =>
  Math.round(Number(after) * 100) - Math.round(Number(before) * 100);

describe('Tableau de bord', () => {
  let martin: string;
  let dubois: string;
  let workshopId: number;
  let clientId: number;
  let sequence = 0;

  const dashboard = async (token = martin, query = '') => {
    const { status, body } = await send<{ data: Dashboard }>(
      'GET',
      `/api/dashboard${query}`,
      { token }
    );
    assert.equal(status, 200);
    return body.data;
  };

  const createQuote = (status: QuoteStatus, validUntil?: Date) => {
    sequence += 1;
    return prisma.quote.create({
      data: {
        workshopId,
        clientId,
        reference: `TST-Q-${Date.now()}-${sequence}`,
        title: 'Devis du tableau de bord',
        status,
        validUntil,
        lines: { create: LINES },
      },
      select: { id: true },
    });
  };

  const createWorksite = async (
    status: WorksiteStatus,
    dueDate: Date | null,
    deliveredAt?: Date
  ) => {
    const quote = await createQuote('accepted');
    sequence += 1;
    return prisma.worksite.create({
      data: {
        workshopId,
        clientId,
        quoteId: quote.id,
        reference: `TST-C-${Date.now()}-${sequence}`,
        title: 'Chantier du tableau de bord',
        status,
        dueDate,
        deliveredAt,
      },
      select: { id: true },
    });
  };

  before(async () => {
    martin = await login(ACCOUNTS.martinMember);
    dubois = await login(ACCOUNTS.duboisAdmin);

    const workshop = await prisma.workshop.findUniqueOrThrow({
      where: { name: 'Atelier Martin' },
    });
    const client = await prisma.client.findFirstOrThrow({
      where: { workshopId: workshop.id, code: 'CLI-0001' },
    });
    workshopId = workshop.id;
    clientId = client.id;
  });

  it('refuse une requête sans jeton (401)', async () => {
    const { status } = await send('GET', '/api/dashboard');
    assert.equal(status, 401);
  });

  it('compte tous les statuts, en accord avec les listes', async () => {
    const data = await dashboard();

    assert.deepEqual(Object.keys(data.worksites.byStatus).sort(), [
      'canceled',
      'delivered',
      'in_production',
      'pending',
      'ready',
    ]);
    assert.deepEqual(Object.keys(data.quotes.byStatus).sort(), [
      'accepted',
      'draft',
      'expired',
      'rejected',
      'sent',
    ]);

    for (const [status, count] of Object.entries(data.worksites.byStatus)) {
      const list = await send<ListResult>(
        'GET',
        `/api/worksites?status=${status}&limit=1`,
        { token: martin }
      );
      assert.equal(count, list.body.meta.total, `chantiers ${status}`);
    }

    for (const [status, count] of Object.entries(data.quotes.byStatus)) {
      const list = await send<ListResult>(
        'GET',
        `/api/quotes?status=${status}&limit=1`,
        { token: martin }
      );
      assert.equal(count, list.body.meta.total, `devis ${status}`);
    }
  });

  describe('chantiers en retard', () => {
    it('ne compte que les chantiers ni livrés ni annulés dont l’échéance est passée', async () => {
      const before = (await dashboard()).worksites.late.total;

      // En retard : échéance passée, chantier encore à livrer.
      await createWorksite('pending', PAST);
      await createWorksite('in_production', PAST);
      await createWorksite('ready', PAST);

      // Pas en retard : livré, annulé, échéance à venir, ou sans échéance.
      await createWorksite('delivered', PAST, PAST);
      await createWorksite('canceled', PAST);
      await createWorksite('in_production', FUTURE);
      await createWorksite('in_production', null);

      const after = (await dashboard()).worksites.late.total;
      assert.equal(after - before, 3);
    });

    it('liste au plus 10 chantiers, du plus en retard au moins en retard', async () => {
      await createWorksite('in_production', PAST);

      const { late } = (await dashboard()).worksites;
      const today = new Date().toISOString().slice(0, 10);

      assert.ok(late.items.length >= 1);
      assert.ok(late.items.length <= 10);
      assert.ok(late.items.length <= late.total);

      for (const item of late.items) {
        assert.ok(['pending', 'in_production', 'ready'].includes(item.status));
        assert.ok(item.dueDate < today);
        assert.ok(item.daysLate >= 1);
        assert.ok(item.client.code);

        const expectedDays = Math.floor(
          (Date.parse(`${today}T00:00:00.000Z`) -
            Date.parse(`${item.dueDate}T00:00:00.000Z`)) /
            86_400_000
        );
        assert.equal(item.daysLate, expectedDays);
      }

      const dates = late.items.map((item) => item.dueDate);
      assert.deepEqual(dates, [...dates].sort());
    });
  });

  describe('devis en attente', () => {
    it('compte les devis envoyés et leur total TTC', async () => {
      const before = (await dashboard()).quotes.pending;
      await createQuote('sent');
      const after = (await dashboard()).quotes.pending;

      assert.equal(after.count - before.count, 1);
      // 3 × 100 € HT, TVA 20 % : 360 € TTC.
      assert.equal(cents(after.totalInclTax, before.totalInclTax), 36000);
    });

    it('n’inclut pas un devis envoyé dont la validité est dépassée', async () => {
      const before = (await dashboard()).quotes.pending;
      const expiredQuote = await createQuote('sent', PAST);
      const after = (await dashboard()).quotes.pending;

      assert.equal(after.count, before.count);

      const stored = await prisma.quote.findUniqueOrThrow({
        where: { id: expiredQuote.id },
      });
      assert.equal(stored.status, 'expired');
    });
  });

  describe('chiffre d’affaires du mois', () => {
    it('somme les devis des chantiers livrés dans le mois (jeu d’essai, septembre 2026)', async () => {
      const { revenue } = await dashboard(martin, '?month=2026-09');

      // Porte d'entrée vitrée : 650 + 16 × 45 + 3 × 45 = 1 505 € HT.
      // TVA 20 % calculée ligne par ligne : 130 + 144 + 27 = 301 €.
      assert.deepEqual(revenue, {
        month: '2026-09',
        deliveredWorksites: 1,
        totalExclTax: '1505.00',
        totalVat: '301.00',
        totalInclTax: '1806.00',
      });
    });

    it('renvoie zéro pour un mois sans livraison', async () => {
      const { revenue } = await dashboard(martin, '?month=2026-01');

      assert.deepEqual(revenue, {
        month: '2026-01',
        deliveredWorksites: 0,
        totalExclTax: '0.00',
        totalVat: '0.00',
        totalInclTax: '0.00',
      });
    });

    it('prend le mois courant par défaut', async () => {
      const { revenue } = await dashboard();
      assert.equal(revenue.month, new Date().toISOString().slice(0, 7));
    });

    it('refuse un mois invalide (400)', async () => {
      for (const month of ['2026-13', 'septembre', '2026-9']) {
        const { status, body } = await send<ErrorResult>(
          'GET',
          `/api/dashboard?month=${month}`,
          { token: martin }
        );

        assert.equal(status, 400, month);
        assert.equal(body.error.code, 'VALIDATION_ERROR');
      }
    });

    it('enregistre la date de livraison et l’ajoute au chiffre d’affaires du mois', async () => {
      const worksite = await createWorksite('ready', null);
      const before = (await dashboard()).revenue;

      const { status } = await send(
        'PATCH',
        `/api/worksites/${worksite.id}/status`,
        { token: martin, body: { status: 'delivered' } }
      );
      assert.equal(status, 200);

      const stored = await prisma.worksite.findUniqueOrThrow({
        where: { id: worksite.id },
      });
      assert.ok(stored.deliveredAt);
      assert.ok(Date.now() - stored.deliveredAt.getTime() < 60_000);

      const after = (await dashboard()).revenue;
      assert.equal(after.deliveredWorksites - before.deliveredWorksites, 1);
      assert.equal(cents(after.totalExclTax, before.totalExclTax), 30000);
      assert.equal(cents(after.totalInclTax, before.totalInclTax), 36000);
    });
  });

  describe('isolation entre ateliers', () => {
    it('ne compte pas les données d’un autre atelier', async () => {
      const data = await dashboard(dubois, '?month=2026-09');

      assert.ok(Object.values(data.worksites.byStatus).every((n) => n === 0));
      assert.equal(data.worksites.late.total, 0);
      assert.deepEqual(data.worksites.late.items, []);
      assert.equal(data.revenue.deliveredWorksites, 0);
      assert.equal(data.revenue.totalInclTax, '0.00');
    });
  });
});
