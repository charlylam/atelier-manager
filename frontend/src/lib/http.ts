import { NextResponse } from 'next/server';
import { ApiError } from './errors';

/**
 * Réponse d'erreur d'un Route Handler : le statut et le code de l'API sont
 * conservés (401, 409, 429...). Sans cela, toute erreur deviendrait une 500
 * et le formulaire ne pourrait pas distinguer un mot de passe faux d'une panne.
 */
export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code ?? 'API_ERROR', message: error.message } },
      { status: error.status }
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Erreur interne' } },
    { status: 500 }
  );
}

/** Corps JSON de la requête, limité aux champs attendus (chaînes de caractères). */
export async function readFields<K extends string>(
  request: Request,
  fields: readonly K[]
): Promise<Record<K, string> | null> {
  const body: unknown = await request.json().catch(() => null);

  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const picked = {} as Record<K, string>;

  for (const field of fields) {
    const value = record[field];
    if (typeof value !== 'string' || value === '') {
      return null;
    }
    picked[field] = value;
  }

  return picked;
}
