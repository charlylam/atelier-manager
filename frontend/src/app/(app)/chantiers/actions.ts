'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import type { StatusActionState } from '@/lib/quote-status-ui';
import { orLogin } from '@/lib/session-guard';
import {
  QUOTE_NOT_FOUND_MESSAGE,
  worksiteConflictMessage,
} from '@/lib/worksite-ui';
import type { Worksite } from '@/lib/worksites';

// Joignable par une requête POST directe : l'API vérifie le jeton, l'atelier et le statut du devis.

// Message affiché pour une erreur de l'API. Toute autre erreur est relancée : c'est notamment
// la redirection vers la connexion lancée par orLogin quand la session a expiré.
function failureMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.status === 404) {
    return QUOTE_NOT_FOUND_MESSAGE;
  }
  if (error.status === 409) {
    return worksiteConflictMessage(error.message);
  }
  return messageForCode(error.code);
}

// Idempotente côté API : si le devis a déjà produit un chantier (200 au lieu de 201), celui-ci
// est renvoyé, et on arrive sur sa fiche comme après une création.
export async function createWorksiteAction(
  quoteId: number
): Promise<StatusActionState> {
  let worksite: Worksite;
  try {
    const { data } = await orLogin(
      apiFetchPrivate<{ data: Worksite }>('/api/worksites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      })
    );
    worksite = data;
  } catch (error) {
    return { message: failureMessage(error) };
  }

  redirect(`/chantiers/${worksite.id}`);
}
