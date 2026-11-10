export const API_URL = process.env.API_URL ?? 'http://localhost:4001';

// Comptes du jeu d'essai (prisma/seeding/seed.ts).
export const ACCOUNTS = {
  martinAdmin: { email: 'admin@atelier-martin.test', password: 'Demo2026!' },
  martinMember: { email: 'membre@atelier-martin.test', password: 'Demo2026!' },
  duboisAdmin: {
    email: 'admin@menuiserie-dubois.test',
    password: 'Demo2026!',
  },
} as const;

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export async function send<T>(
  method: Method,
  path: string,
  options: { body?: unknown; token?: string } = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // Une réponse 204 n'a pas de corps.
  const text = await res.text();
  let body: T;
  try {
    body = (text ? JSON.parse(text) : undefined) as T;
  } catch {
    throw new Error(
      `Réponse non JSON (${res.status}) sur ${method} ${path} : ${text.slice(0, 120)}`
    );
  }
  return { status: res.status, body };
}

export async function login(account: { email: string; password: string }) {
  const { status, body } = await send<{ token: string }>(
    'POST',
    '/api/auth/login',
    { body: account }
  );
  if (status !== 200) {
    throw new Error(`Connexion impossible pour ${account.email} (${status})`);
  }
  return body.token;
}
