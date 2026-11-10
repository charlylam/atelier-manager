import { z } from 'zod';

// Date AAAA-MM-JJ lue en UTC. Une échéance passée est acceptée : un chantier
// peut être en retard.
const dateSchema = z.iso
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

// Nombre d'heures : 4 chiffres et 2 décimales au plus, jamais négatif.
// On passe par une chaîne pour ne pas perdre de précision en flottant.
const hoursSchema = z
  .union([z.number(), z.string()])
  .transform((value) => String(value).trim())
  .pipe(
    z
      .string()
      .regex(
        /^\d{1,4}(\.\d{1,2})?$/,
        'Nombre d’heures invalide (2 décimales au plus)'
      )
  );

const nonEmpty = (data: object) => Object.keys(data).length > 0;
const nonEmptyMessage = { message: 'Au moins un champ doit être fourni' };

/** Corps de POST /api/worksites : création depuis un devis accepté. */
export const createWorksiteBodySchema = z.object({
  quoteId: z.number().int().positive(),
  dueDate: dateSchema.optional(),
  siteAddress: z.string().trim().min(1).max(200).optional(),
});

/** Corps de PATCH /api/worksites/:id. */
export const updateWorksiteBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    siteAddress: z.string().trim().min(1).max(200).nullable().optional(),
    dueDate: dateSchema.nullable().optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);

/** Corps de PATCH /api/worksites/:id/status. */
export const worksiteStatusBodySchema = z.object({
  status: z.enum(['in_production', 'ready', 'delivered', 'canceled']),
});

/** Corps de POST /api/worksites/:id/phases. */
export const createPhaseBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  estimatedHours: hoursSchema.default('0'),
  notes: z.string().trim().min(1).max(1000).optional(),
  assigneeId: z.number().int().positive().optional(),
});

/** Corps de PATCH /api/worksites/:id/phases/:phaseId. */
export const updatePhaseBodySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    estimatedHours: hoursSchema.optional(),
    actualHours: hoursSchema.optional(),
    notes: z.string().trim().min(1).max(1000).nullable().optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);

/** Corps de PUT /api/worksites/:id/phases/order : tous les identifiants, dans le nouvel ordre. */
export const reorderPhasesBodySchema = z.object({
  phaseIds: z
    .array(z.number().int().positive())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'Identifiants en double',
    }),
});

/** Paramètres de GET /api/worksites. */
export const listWorksitesQuerySchema = z.object({
  status: z
    .enum(['pending', 'in_production', 'ready', 'delivered', 'canceled'])
    .optional(),
  clientId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const worksiteIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const phaseParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  phaseId: z.coerce.number().int().positive(),
});

export type CreateWorksiteBody = z.infer<typeof createWorksiteBodySchema>;
export type UpdateWorksiteBody = z.infer<typeof updateWorksiteBodySchema>;
export type RequestedWorksiteStatus = z.infer<
  typeof worksiteStatusBodySchema
>['status'];
export type CreatePhaseBody = z.infer<typeof createPhaseBodySchema>;
export type UpdatePhaseBody = z.infer<typeof updatePhaseBodySchema>;
export type ListWorksitesQuery = z.infer<typeof listWorksitesQuerySchema>;
