'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import type { Quote } from '@/lib/quotes';
import {
  QUOTE_NOT_FOUND_MESSAGE,
  conflictMessage,
} from '@/lib/quote-status-ui';
import type { StatusActionState, StatusTarget } from '@/lib/quote-status-ui';
import { orLogin } from '@/lib/session-guard';

// Joignables par une requête POST directe : l'API vérifie le jeton, l'atelier, la transition
// et refuse toute valeur de statut hors de sent, accepted et rejected (400).

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
    return conflictMessage(error.message);
  }
  return messageForCode(error.code);
}

export async function changeQuoteStatusAction(
  quoteId: number,
  target: StatusTarget
): Promise<StatusActionState> {
  try {
    await orLogin(
      apiFetchPrivate(`/api/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      })
    );
  } catch (error) {
    return { message: failureMessage(error) };
  }

  redirect(`/devis/${quoteId}`);
}

export async function duplicateQuoteAction(
  quoteId: number
): Promise<StatusActionState> {
  let copy: Quote;
  try {
    const { data } = await orLogin(
      apiFetchPrivate<{ data: Quote }>(`/api/quotes/${quoteId}/duplicate`, {
        method: 'POST',
      })
    );
    copy = data;
  } catch (error) {
    return { message: failureMessage(error) };
  }

  redirect(`/devis/${copy.id}`);
}
