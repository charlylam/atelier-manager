import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

// Déconnexion : le jeton est sans état côté API, il suffit de supprimer le cookie.
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: 'Déconnexion réussie' });
}
