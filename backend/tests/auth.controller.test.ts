import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const API_URL = process.env.API_URL ?? 'http://localhost:4001';

// Compte administrateur du jeu d'essai (prisma/seeding/seed.ts).
const ADMIN = { email: 'admin@atelier-martin.test', password: 'Demo2026!' };

interface ApiBody {
  message?: string;
  token?: string;
  user?: { id: number; workshopId: number; email: string; role: string };
  data?: { email: string; role: string; workshop: { name: string } };
  error?: { code: string; message: string };
}

async function send(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body:
      body === undefined
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as ApiBody };
}

describe('POST /api/auth/register', () => {
  const suffix = Date.now();
  const payload = {
    workshopName: `Atelier test ${suffix}`,
    firstName: 'Camille',
    lastName: 'Test',
    email: `inscription-${suffix}@example.test`,
    password: 'Motdepasse!2026',
  };

  it('crée l’atelier et son administrateur', async () => {
    const { status, body } = await send('POST', '/api/auth/register', payload);

    assert.equal(status, 201);
    assert.equal(body.user?.role, 'admin');
    assert.equal(typeof body.user?.workshopId, 'number');
    assert.equal(body.user?.email, payload.email);
    // Le hash du mot de passe ne doit jamais sortir de l'API.
    assert.ok(!JSON.stringify(body).includes('passwordHash'));
  });

  it('permet de se connecter avec le compte créé', async () => {
    const { status, body } = await send('POST', '/api/auth/login', {
      email: payload.email,
      password: payload.password,
    });

    assert.equal(status, 200);
    assert.ok(body.token);
  });

  it('refuse un e-mail déjà utilisé (409)', async () => {
    const { status, body } = await send('POST', '/api/auth/register', {
      ...payload,
      workshopName: `Autre atelier ${suffix}`,
    });

    assert.equal(status, 409);
    assert.equal(body.error?.code, 'CONFLICT');
  });

  it('refuse un mot de passe trop faible (400)', async () => {
    const { status, body } = await send('POST', '/api/auth/register', {
      ...payload,
      email: `faible-${suffix}@example.test`,
      workshopName: `Atelier faible ${suffix}`,
      password: 'faible',
    });

    assert.equal(status, 400);
    assert.equal(body.error?.code, 'VALIDATION_ERROR');
  });

  it('répond 400, et non 500, à un JSON illisible', async () => {
    const { status, body } = await send(
      'POST',
      '/api/auth/register',
      '{"email":'
    );

    assert.equal(status, 400);
    assert.equal(body.error?.code, 'VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('renvoie un jeton qui contient l’atelier et le rôle', async () => {
    const { status, body } = await send('POST', '/api/auth/login', ADMIN);

    assert.equal(status, 200);
    assert.ok(body.token);

    const payload = jwt.decode(body.token) as {
      userId: number;
      workshopId: number;
      role: string;
    };
    assert.equal(payload.role, 'admin');
    assert.equal(typeof payload.workshopId, 'number');
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    const { status, body } = await send('POST', '/api/auth/login', {
      email: ADMIN.email,
      password: 'Mauvais!2026',
    });

    assert.equal(status, 401);
    assert.equal(body.error?.code, 'UNAUTHORIZED');
    assert.equal(body.error?.message, 'Invalid email or password');
  });

  it('donne la même réponse pour un e-mail inconnu', async () => {
    const { status, body } = await send('POST', '/api/auth/login', {
      email: 'inconnu@example.test',
      password: 'Mauvais!2026',
    });

    assert.equal(status, 401);
    assert.equal(body.error?.message, 'Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('refuse une requête sans jeton (401)', async () => {
    const { status } = await send('GET', '/api/auth/me');
    assert.equal(status, 401);
  });

  it('répond 401, et non 500, à un jeton mal formé', async () => {
    const { status, body } = await send('GET', '/api/auth/me', undefined, {
      Authorization: 'Bearer pas-un-jwt',
    });

    assert.equal(status, 401);
    assert.equal(body.error?.code, 'UNAUTHORIZED');
  });

  it('renvoie l’utilisateur connecté et son atelier', async () => {
    const login = await send('POST', '/api/auth/login', ADMIN);
    const { status, body } = await send('GET', '/api/auth/me', undefined, {
      Authorization: `Bearer ${login.body.token}`,
    });

    assert.equal(status, 200);
    assert.equal(body.data?.email, ADMIN.email);
    assert.equal(body.data?.workshop.name, 'Atelier Martin');
  });
});
