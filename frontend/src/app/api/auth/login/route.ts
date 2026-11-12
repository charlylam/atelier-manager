import { NextResponse } from 'next/server';
import { errorResponse, readFields } from '@/lib/http';
import { startSession } from '@/lib/session';

// Connexion : le navigateur envoie e-mail et mot de passe à ce Route Handler,
// qui interroge l'API et pose le cookie de session côté serveur.
export async function POST(request: Request) {
  const credentials = await readFields(request, ['email', 'password']);

  if (!credentials) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'E-mail et mot de passe requis',
        },
      },
      { status: 400 }
    );
  }

  try {
    const user = await startSession(credentials);
    return NextResponse.json({ data: { user } });
  } catch (error) {
    return errorResponse(error);
  }
}
