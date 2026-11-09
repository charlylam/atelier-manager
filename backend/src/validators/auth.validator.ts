import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

// 8 caractères minimum. Le plafond de 128 évite de hacher une chaîne démesurée.
// (La limite de 72 octets est celle de bcrypt, pas d'Argon2.)
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128)
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(
    /[^A-Za-z0-9]/,
    'Le mot de passe doit contenir au moins un caractère spécial'
  );

/** Corps de POST /api/auth/register : crée l'atelier et son administrateur. */
export const registerBodySchema = z.object({
  workshopName: z.string().trim().min(2).max(100),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: passwordSchema,
});

/** Corps de POST /api/auth/login. */
export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
