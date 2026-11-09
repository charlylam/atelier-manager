import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import { isForeignKeyViolation } from '../lib/prisma-errors.js';
import { clientSelect, createClient } from '../services/client.service.js';
import {
  clientIdParamSchema,
  createClientBodySchema,
  listClientsQuerySchema,
  updateClientBodySchema,
} from '../validators/client.validator.js';

export async function listClients(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { search, page, limit } = listClientsQuerySchema.parse(req.query);

  const where: Prisma.ClientWhereInput = {
    workshopId,
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
  };

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: clientSelect,
    }),
    prisma.client.count({ where }),
  ]);

  return res.status(200).json({
    data: clients,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getClient(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = clientIdParamSchema.parse(req.params);

  const client = await prisma.client.findFirst({
    where: { id, workshopId },
    select: {
      ...clientSelect,
      quotes: {
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          validUntil: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      worksites: {
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          dueDate: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!client) {
    throw new NotFoundError('Client not found');
  }

  return res.status(200).json({ data: client });
}

export async function addClient(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const data = createClientBodySchema.parse(req.body);

  const client = await createClient(workshopId, data);

  return res.status(201).json({ data: client });
}

export async function updateClient(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = clientIdParamSchema.parse(req.params);
  const data = updateClientBodySchema.parse(req.body);

  const existing = await prisma.client.findFirst({
    where: { id, workshopId },
    select: { id: true },
  });

  if (!existing) {
    throw new NotFoundError('Client not found');
  }

  const client = await prisma.client.update({
    where: { id },
    data,
    select: clientSelect,
  });

  return res.status(200).json({ data: client });
}

export async function removeClient(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = clientIdParamSchema.parse(req.params);

  try {
    // L'atelier fait partie de la condition : un client d'un autre atelier
    // n'est jamais supprimé.
    const { count } = await prisma.client.deleteMany({
      where: { id, workshopId },
    });

    if (count === 0) {
      throw new NotFoundError('Client not found');
    }
  } catch (error) {
    // La contrainte RESTRICT de la base refuse la suppression d'un client
    // qui a des devis ou des chantiers.
    if (isForeignKeyViolation(error)) {
      throw new ConflictError(
        'Client has quotes or worksites and cannot be deleted'
      );
    }
    throw error;
  }

  return res.status(204).send();
}
