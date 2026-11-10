import { ConflictError } from './errors.js';
import { isUniqueViolation } from './prisma-errors.js';

/**
 * Relance une opération qui échoue sur une contrainte d'unicité, par exemple
 * quand deux créations simultanées calculent la même référence.
 */
export async function retryOnUniqueViolation<T>(
  operation: () => Promise<T>,
  failureMessage: string,
  maxAttempts = 5
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }

  throw new ConflictError(failureMessage);
}
