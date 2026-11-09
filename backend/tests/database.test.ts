import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma.js';

const errorCode = (error: unknown) => (error as { code?: string }).code;

describe('Contraintes du schéma', () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it('refuse deux devis de même référence dans un atelier (P2002)', async () => {
    const quote = await prisma.quote.findFirstOrThrow({
      where: {
        reference: 'DEV-2026-0001',
        workshop: { name: 'Atelier Martin' },
      },
    });

    await assert.rejects(
      async () => {
        await prisma.quote.create({
          data: {
            workshopId: quote.workshopId,
            clientId: quote.clientId,
            reference: quote.reference,
            title: 'Doublon',
          },
        });
      },
      (error: unknown) => errorCode(error) === 'P2002'
    );
  });

  it('accepte la même référence de devis dans deux ateliers', async () => {
    const count = await prisma.quote.count({
      where: { reference: 'DEV-2026-0001' },
    });
    assert.equal(count, 2);
  });

  it('refuse de supprimer un client qui a des devis (P2003)', async () => {
    const client = await prisma.client.findFirstOrThrow({
      where: { code: 'CLI-0001', workshop: { name: 'Atelier Martin' } },
    });

    await assert.rejects(
      async () => {
        await prisma.client.delete({ where: { id: client.id } });
      },
      (error: unknown) => errorCode(error) === 'P2003'
    );
  });

  it('refuse de supprimer un devis qui a généré un chantier (P2003)', async () => {
    const worksite = await prisma.worksite.findFirstOrThrow({
      where: {
        reference: 'CH-2026-0001',
        workshop: { name: 'Atelier Martin' },
      },
    });

    await assert.rejects(
      async () => {
        await prisma.quote.delete({ where: { id: worksite.quoteId } });
      },
      (error: unknown) => errorCode(error) === 'P2003'
    );
  });

  it('refuse un second chantier pour le même devis (P2002)', async () => {
    const worksite = await prisma.worksite.findFirstOrThrow({
      where: {
        reference: 'CH-2026-0001',
        workshop: { name: 'Atelier Martin' },
      },
    });

    await assert.rejects(
      async () => {
        await prisma.worksite.create({
          data: {
            workshopId: worksite.workshopId,
            clientId: worksite.clientId,
            quoteId: worksite.quoteId,
            reference: 'CH-2026-9999',
            title: 'Second chantier',
          },
        });
      },
      (error: unknown) => errorCode(error) === 'P2002'
    );
  });

  it('refuse deux phases à la même position dans un chantier (P2002)', async () => {
    const worksite = await prisma.worksite.findFirstOrThrow({
      where: {
        reference: 'CH-2026-0001',
        workshop: { name: 'Atelier Martin' },
      },
    });

    await assert.rejects(
      async () => {
        await prisma.phase.create({
          data: {
            worksiteId: worksite.id,
            position: 1,
            name: 'Doublon',
            estimatedHours: 1,
          },
        });
      },
      (error: unknown) => errorCode(error) === 'P2002'
    );
  });
});
