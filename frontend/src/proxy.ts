import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';

// Filtre d'accès (Next.js 16 : proxy.ts remplace middleware.ts).
// Il ne vérifie que la présence du cookie de session. La validité du jeton
// est vérifiée par l'API, à chaque appel : un jeton expiré ou falsifié mène à
// une 401, et la page renvoie alors vers la connexion.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/connexion', request.url);
  loginUrl.searchParams.set(
    'redirect',
    request.nextUrl.pathname + request.nextUrl.search
  );
  return NextResponse.redirect(loginUrl);
}

// Pages réservées aux utilisateurs connectés.
export const config = {
  matcher: [
    '/tableau-de-bord/:path*',
    '/clients/:path*',
    '/devis/:path*',
    '/chantiers/:path*',
  ],
};
