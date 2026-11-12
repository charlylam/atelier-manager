'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import {
  DELETE_CONFLICT_MESSAGE,
  fieldErrorsFromApi,
  toCreatePayload,
  toUpdatePayload,
  validateClientValues,
  valuesFromFormData,
} from '@/lib/client-form';
import type { ClientFormState, ClientFormValues } from '@/lib/client-form';
import type { Client } from '@/lib/clients';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import { orLogin } from '@/lib/session-guard';

// Chaque action est joignable par une requête POST directe : l'API vérifie le jeton
// et l'atelier à chaque appel (apiFetchPrivate), les actions n'ont donc rien à contourner.

export type DeleteClientState = { message?: string };

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Erreur de l'API devenue état du formulaire. Toute autre erreur est relancée : c'est
// notamment la redirection vers la connexion lancée par orLogin quand la session a expiré.
function failure(error: unknown, values: ClientFormValues): ClientFormState {
  if (!(error instanceof ApiError)) {
    throw error;
  }

  if (error.code === 'VALIDATION_ERROR') {
    return {
      message: messageForCode('VALIDATION_ERROR'),
      fieldErrors: fieldErrorsFromApi(error.details),
      values,
    };
  }

  const message =
    error.status === 404
      ? 'Ce client n’existe plus.'
      : error.status === 409
        ? 'Un conflit empêche l’enregistrement. Réessayez.'
        : messageForCode(error.code);

  return { message, fieldErrors: {}, values };
}

export async function createClientAction(
  _previous: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const values = valuesFromFormData(formData);

  const fieldErrors = validateClientValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  let created: Client;
  try {
    const { data } = await orLogin(
      apiFetchPrivate<{ data: Client }>('/api/clients', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(toCreatePayload(values)),
      })
    );
    created = data;
  } catch (error) {
    return failure(error, values);
  }

  redirect(`/clients/${created.id}`);
}

export async function updateClientAction(
  id: number,
  _previous: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const values = valuesFromFormData(formData);

  const fieldErrors = validateClientValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(toUpdatePayload(values)),
      })
    );
  } catch (error) {
    return failure(error, values);
  }

  redirect(`/clients/${id}`);
}

export async function deleteClientAction(
  id: number
): Promise<DeleteClientState> {
  try {
    await orLogin(apiFetchPrivate(`/api/clients/${id}`, { method: 'DELETE' }));
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw error;
    }
    if (error.status === 409) {
      return { message: DELETE_CONFLICT_MESSAGE };
    }
    if (error.status === 404) {
      return { message: 'Ce client n’existe plus.' };
    }
    return { message: messageForCode(error.code) };
  }

  redirect('/clients');
}
