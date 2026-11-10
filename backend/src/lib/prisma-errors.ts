import { Prisma } from '@prisma/client';

function hasCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

/** Contrainte d'unicité violée. */
export const isUniqueViolation = (error: unknown) => hasCode(error, 'P2002');

/** Clé étrangère violée (par exemple un RESTRICT à la suppression). */
export const isForeignKeyViolation = (error: unknown) =>
  hasCode(error, 'P2003');
