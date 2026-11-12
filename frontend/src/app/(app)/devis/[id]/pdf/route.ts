import { NextResponse } from 'next/server';
import { apiFetchPrivateResponse } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';

// Le PDF est généré par l'API et demande le jeton, que le navigateur ne peut pas envoyer
// (cookie httpOnly) : ce Route Handler le relaie. La protection de /devis/... par
// proxy.ts s'applique aussi à cette route.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === undefined) {
    return new NextResponse('Devis introuvable', { status: 404 });
  }

  try {
    const upstream = await apiFetchPrivateResponse(`/api/quotes/${id}/pdf`);

    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          upstream.headers.get('content-disposition') ??
          `attachment; filename="devis-${id}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.status === 401) {
      return NextResponse.redirect(
        new URL('/connexion?session=expiree', request.url)
      );
    }
    if (error.status === 404) {
      return new NextResponse('Devis introuvable', { status: 404 });
    }
    return new NextResponse('Le PDF n’a pas pu être généré.', {
      status: error.status >= 500 ? 502 : error.status,
    });
  }
}
