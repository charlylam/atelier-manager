import { cookies } from 'next/headers';
import { apiFetch } from './api';
import { ApiError } from './errors';
import { SESSION_COOKIE, SESSION_MAX_AGE } from './constants';

type SessionUser = {
  id: number;
  workshopId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'member';
};

type LoginResponse = { token?: string; user: SessionUser };

/** Pose le cookie de session, invisible pour le JavaScript de la page. */
export async function setSessionCookie(token: string) {
  (await cookies()).set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true, // illisible côté navigateur : protège le jeton d'une faille XSS
    path: '/',
    secure: process.env.NODE_ENV === 'production', // HTTPS seulement en production
    sameSite: 'strict', // le navigateur ne l'envoie pas depuis un autre site (CSRF)
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Connecte l'utilisateur auprès de l'API et pose le cookie de session.
 * Le jeton n'est jamais renvoyé au navigateur : seul l'utilisateur l'est.
 */
export async function startSession(credentials: {
  email: string;
  password: string;
}) {
  const { token, user } = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!token) {
    throw new ApiError(
      'Réponse de connexion invalide',
      502,
      'INVALID_RESPONSE'
    );
  }

  await setSessionCookie(token);
  return user;
}
