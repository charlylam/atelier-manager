import { cookies } from 'next/headers';
import { ApiError } from './errors';
import type { ApiErrorDetail } from './errors';
import { SESSION_COOKIE } from './constants';

// Utilisateur renvoyé par GET /api/auth/me.
export type CurrentUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'member';
  workshop: { id: number; name: string };
};

function apiUrl() {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error('API_URL is not defined in environment variables');
  }
  return url;
}

/**
 * Appel de l'API sans jeton (inscription, connexion).
 * Une réponse en erreur lève une ApiError qui porte le statut, le code et, pour une
 * erreur de validation, le détail des champs ; une API injoignable lève une ApiError 503.
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = apiUrl();

  let response: Response;
  try {
    response = await fetch(`${url}${endpoint}`, options);
  } catch {
    throw new ApiError('API injoignable', 503, 'API_UNREACHABLE');
  }

  if (!response.ok) {
    let body:
      | {
          error?: {
            code?: string;
            message?: string;
            details?: ApiErrorDetail[];
          };
        }
      | undefined;
    try {
      body = await response.json();
    } catch {
      console.error(
        `Réponse non-JSON pour ${endpoint} (status ${response.status})`
      );
    }

    throw new ApiError(
      body?.error?.message ?? `Erreur API : ${response.status}`,
      response.status,
      body?.error?.code,
      body?.error?.details
    );
  }

  // 204 (suppression) ou corps vide : rien à analyser.
  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0'
  ) {
    return null as T;
  }

  return (await response.json()) as T;
}

/**
 * Appel de l'API avec le jeton du cookie de session, transmis en
 * "Authorization: Bearer". Le jeton n'est lisible que côté serveur (cookie httpOnly).
 */
export async function apiFetchPrivate<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return apiFetch<T>(endpoint, { ...options, headers });
}

/** Utilisateur connecté et son atelier. Lève une ApiError 401 si le jeton est refusé. */
export async function getMe(): Promise<CurrentUser> {
  const { data } = await apiFetchPrivate<{ data: CurrentUser }>('/api/auth/me');
  return data;
}

/**
 * Utilisateur connecté, ou null s'il n'y a pas de session ou si l'API refuse le
 * jeton (expiré, invalide). Toute autre erreur est relancée.
 */
export async function getCurrentUserOrNull(): Promise<CurrentUser | null> {
  if (!(await cookies()).has(SESSION_COOKIE)) {
    return null;
  }

  try {
    return await getMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
