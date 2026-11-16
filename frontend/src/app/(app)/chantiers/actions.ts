'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import type { StatusActionState } from '@/lib/quote-status-ui';
import {
  NOT_EDITABLE_MESSAGE,
  WORKSITE_GONE_MESSAGE,
  toUpdateWorksitePayload,
  validateWorksiteValues,
  worksiteFieldErrorsFromApi,
  worksiteValuesFromFormData,
} from '@/lib/worksite-form';
import type { WorksiteFormState } from '@/lib/worksite-form';
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

// Échec de la modification : on garde la saisie, et on place les champs refusés par l'API.
function updateFailure(
  error: unknown,
  values: WorksiteFormState['values']
): WorksiteFormState {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.code === 'VALIDATION_ERROR') {
    return {
      message: messageForCode('VALIDATION_ERROR'),
      fieldErrors: worksiteFieldErrorsFromApi(error.details),
      values,
    };
  }
  // Le seul 409 de cette route : chantier livré ou annulé.
  if (error.status === 409) {
    return { message: NOT_EDITABLE_MESSAGE, fieldErrors: {}, values };
  }
  if (error.status === 404) {
    return { message: WORKSITE_GONE_MESSAGE, fieldErrors: {}, values };
  }
  return { message: messageForCode(error.code), fieldErrors: {}, values };
}

export async function updateWorksiteAction(
  id: number,
  _previous: WorksiteFormState,
  formData: FormData
): Promise<WorksiteFormState> {
  const values = worksiteValuesFromFormData(formData);

  const fieldErrors = validateWorksiteValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toUpdateWorksitePayload(values)),
      })
    );
  } catch (error) {
    return updateFailure(error, values);
  }

  redirect(`/chantiers/${id}`);
}
