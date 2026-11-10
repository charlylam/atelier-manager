import { z } from 'zod';
import { startOfToday } from '../lib/dates.js';

// Date AAAA-MM-JJ, pas dans le passé.
const validUntilSchema = z.iso
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`))
  .refine((date) => date >= startOfToday(), {
    message: 'La date de validité ne peut pas être dans le passé',
  });

// Montant décimal : nombre ou chaîne, 2 décimales au plus, jamais négatif.
// On passe par une chaîne pour ne pas perdre de précision en flottant.
const decimal = (maxIntegerDigits: number) =>
  z
    .union([z.number(), z.string()])
    .transform((value) => String(value).trim())
    .pipe(
      z
        .string()
        .regex(
          new RegExp(`^\\d{1,${maxIntegerDigits}}(\\.\\d{1,2})?$`),
          'Valeur numérique invalide (2 décimales au plus)'
        )
    );

const quantitySchema = decimal(8).refine((value) => Number(value) > 0, {
  message: 'La quantité doit être supérieure à 0',
});

const lineTypeSchema = z.enum(['material', 'labor', 'service', 'other']);

const nonEmpty = (data: object) => Object.keys(data).length > 0;
const nonEmptyMessage = { message: 'Au moins un champ doit être fourni' };

/** Corps de POST /api/quotes. */
export const createQuoteBodySchema = z.object({
  clientId: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000).optional(),
  validUntil: validUntilSchema.optional(),
});

/** Corps de PATCH /api/quotes/:id. */
export const updateQuoteBodySchema = z
  .object({
    clientId: z.number().int().positive().optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).nullable().optional(),
    validUntil: validUntilSchema.nullable().optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);

/** Corps de PATCH /api/quotes/:id/status. */
export const quoteStatusBodySchema = z.object({
  status: z.enum(['sent', 'accepted', 'rejected']),
});

/** Corps de POST /api/quotes/:id/lines (TVA à 20 % par défaut). */
export const createLineBodySchema = z.object({
  type: lineTypeSchema,
  label: z.string().trim().min(1).max(200),
  quantity: quantitySchema,
  unit: z.string().trim().min(1).max(20),
  unitPrice: decimal(8),
  vatRate: decimal(2).default('20'),
});

/** Corps de PATCH /api/quotes/:id/lines/:lineId. */
export const updateLineBodySchema = z
  .object({
    type: lineTypeSchema.optional(),
    label: z.string().trim().min(1).max(200).optional(),
    quantity: quantitySchema.optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    unitPrice: decimal(8).optional(),
    vatRate: decimal(2).optional(),
  })
  .refine(nonEmpty, nonEmptyMessage);

/** Paramètres de GET /api/quotes. */
export const listQuotesQuerySchema = z.object({
  status: z
    .enum(['draft', 'sent', 'accepted', 'rejected', 'expired'])
    .optional(),
  clientId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const quoteIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const lineParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  lineId: z.coerce.number().int().positive(),
});

export type CreateQuoteBody = z.infer<typeof createQuoteBodySchema>;
export type UpdateQuoteBody = z.infer<typeof updateQuoteBodySchema>;
export type RequestedQuoteStatus = z.infer<
  typeof quoteStatusBodySchema
>['status'];
export type CreateLineBody = z.infer<typeof createLineBodySchema>;
export type UpdateLineBody = z.infer<typeof updateLineBodySchema>;
export type ListQuotesQuery = z.infer<typeof listQuotesQuerySchema>;
