import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

/** Corps de POST /api/clients. */
export const createClientBodySchema = z.object({
  name: z.string().trim().min(1).max(150),
  isCompany: z.boolean().default(false),
  email: emailSchema.optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  address: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().min(1).max(1000).optional(),
});

/** Corps de PATCH /api/clients/:id. Le code client n'est pas modifiable. */
export const updateClientBodySchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    isCompany: z.boolean().optional(),
    email: emailSchema.nullable().optional(),
    phone: z.string().trim().min(1).max(30).nullable().optional(),
    address: z.string().trim().min(1).max(200).nullable().optional(),
    notes: z.string().trim().min(1).max(1000).nullable().optional(),
  })
  // Au moins un champ doit être fourni.
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni',
  });

/** Paramètres de GET /api/clients. */
export const listClientsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** Paramètre d'URL : l'identifiant d'un client (entier). */
export const clientIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateClientBody = z.infer<typeof createClientBodySchema>;
export type UpdateClientBody = z.infer<typeof updateClientBodySchema>;
