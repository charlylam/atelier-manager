'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import type { StatusActionState } from '@/lib/quote-status-ui';
import { orLogin } from '@/lib/session-guard';
import type { WorksiteTarget } from '@/lib/worksite-status-ui';
import {
  WORKSITE_NOT_FOUND_MESSAGE,
  worksiteStatusConflictMessage,
} from '@/lib/worksite-ui';

// Joignable par une requête POST directe : l'API vérifie le jeton, l'atelier, la transition,
// l'état des phases, et refuse toute valeur de statut hors de la liste (400).

// Message affiché pour une erreur de l'API. Toute autre erreur est relancée : c'est notamment
// la redirection vers la connexion lancée par orLogin quand la session a expiré.
function failureMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.status === 404) {
    return WORKSITE_NOT_FOUND_MESSAGE;
  }
  if (error.status === 409) {
    return worksiteStatusConflictMessage(error.message);
  }
  return messageForCode(error.code);
}

export async function changeWorksiteStatusAction(
  worksiteId: number,
  target: WorksiteTarget
): Promise<StatusActionState> {
  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      })
    );
  } catch (error) {
    return { message: failureMessage(error) };
  }

  redirect(`/chantiers/${worksiteId}`);
}
