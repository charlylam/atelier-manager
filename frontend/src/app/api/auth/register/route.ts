import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api';
import { errorResponse, readFields } from '@/lib/http';
import { startSession } from '@/lib/session';

// Inscription : crée l'atelier et son administrateur, puis ouvre la session.
export async function POST(request: Request) {
  const fields = await readFields(request, [
    'workshopName',
    'firstName',
    'lastName',
    'email',
    'password',
  ]);

  if (!fields) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tous les champs sont requis',
        },
      },
      { status: 400 }
    );
  }

  try {
    await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    const user = await startSession({
      email: fields.email,
      password: fields.password,
    });
    return NextResponse.json({ data: { user } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
