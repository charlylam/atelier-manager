import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ConflictError } from '../lib/errors.js';
import { isUniqueViolation } from '../lib/prisma-errors.js';
import type { CreateClientBody } from '../validators/client.validator.js';

const CODE_PREFIX = 'CLI-';
const MAX_ATTEMPTS = 5;

// Champs renvoyés au frontend.
export const clientSelect = {
  id: true,
  code: true,
  name: true,
  isCompany: true,
  email: true,
  phone: true,
  address: true,
  notes: true,
  createdAt: true,
} satisfies Prisma.ClientSelect;

// Code suivant dans l'atelier : CLI-0001, CLI-0002...
async function nextClientCode(
  tx: Prisma.TransactionClient,
  workshopId: number
) {
  const last = await tx.client.findFirst({
    where: { workshopId },
    orderBy: { id: 'desc' },
    select: { code: true },
  });
  const lastNumber = last ? Number(last.code.slice(CODE_PREFIX.length)) : 0;
  return `${CODE_PREFIX}${String(lastNumber + 1).padStart(4, '0')}`;
}

export async function createClient(workshopId: number, data: CreateClientBody) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const code = await nextClientCode(tx, workshopId);
        return tx.client.create({
          data: { ...data, workshopId, code },
          select: clientSelect,
        });
      });
    } catch (error) {
      // Deux créations simultanées peuvent calculer le même code : la contrainte
      // d'unicité (workshop_id, code) refuse la seconde, qui reprend avec le
      // numéro suivant.
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new ConflictError('Could not allocate a client code, please retry');
}
