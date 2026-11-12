import { redirect } from 'next/navigation';
import { ApiError } from './errors';

/**
 * Attend un appel authentifié et renvoie vers la connexion si l'API refuse le
 * jeton (401 : expiré ou falsifié). Toute autre erreur est relancée.
 * À utiliser dans les Server Components qui appellent l'API avec le cookie de session.
 */
export async function orLogin<T>(call: Promise<T>): Promise<T> {
  try {
    return await call;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/connexion?session=expiree');
    }
    throw error;
  }
}
