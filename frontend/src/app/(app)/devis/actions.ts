'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import {
  lineFieldErrorsFromApi,
  lineValuesFromFormData,
  toLinePayload,
  validateLineValues,
} from '@/lib/line-form';
import type { LineFormState, LineFormValues } from '@/lib/line-form';
import { messageForCode } from '@/lib/messages';
import {
  NOT_DRAFT_MESSAGE,
  quoteFieldErrorsFromApi,
  quoteValuesFromFormData,
  toCreateQuotePayload,
  toUpdateQuotePayload,
  validateQuoteValues,
} from '@/lib/quote-form';
import type { QuoteFormState, QuoteFormValues } from '@/lib/quote-form';
import type { Quote } from '@/lib/quotes';
import { orLogin } from '@/lib/session-guard';

// Chaque action est joignable par une requête POST directe : l'API vérifie le jeton, l'atelier
// et le statut du devis à chaque appel (apiFetchPrivate), les actions n'ont rien à contourner.

const JSON_HEADERS = { 'Content-Type': 'application/json' };

type Failure = {
  message: string;
  fieldErrors: Record<string, string>;
};

// Message affiché pour une erreur de l'API. Toute autre erreur est relancée : c'est notamment
// la redirection vers la connexion lancée par orLogin quand la session a expiré.
function describe(
  error: unknown,
  fieldErrorsOf: (details: ApiError['details']) => Record<string, string>,
  notFoundMessage: string
): Failure {
  if (!(error instanceof ApiError)) {
    throw error;
  }

  if (error.code === 'VALIDATION_ERROR') {
    return {
      message: messageForCode('VALIDATION_ERROR'),
      fieldErrors: fieldErrorsOf(error.details),
    };
  }
  if (error.status === 409) {
    return { message: NOT_DRAFT_MESSAGE, fieldErrors: {} };
  }
  if (error.status === 404) {
    return { message: notFoundMessage, fieldErrors: {} };
  }
  return { message: messageForCode(error.code), fieldErrors: {} };
}

const quoteFieldErrorsOf = (details: ApiError['details']) =>
  quoteFieldErrorsFromApi(details);
const lineFieldErrorsOf = (details: ApiError['details']) =>
  lineFieldErrorsFromApi(details);

function quoteFailure(
  error: unknown,
  values: QuoteFormValues,
  notFound: string
): QuoteFormState {
  return { ...describe(error, quoteFieldErrorsOf, notFound), values };
}

function lineFailure(error: unknown, values: LineFormValues): LineFormState {
  return {
    ...describe(
      error,
      lineFieldErrorsOf,
      'Ce devis ou cette ligne n’existe plus.'
    ),
    values,
  };
}

export async function createQuoteAction(
  _previous: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const values = quoteValuesFromFormData(formData);

  const fieldErrors = validateQuoteValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  let created: Quote;
  try {
    const { data } = await orLogin(
      apiFetchPrivate<{ data: Quote }>('/api/quotes', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(toCreateQuotePayload(values)),
      })
    );
    created = data;
  } catch (error) {
    return quoteFailure(error, values, 'Ce client n’existe pas.');
  }

  redirect(`/devis/${created.id}`);
}

export async function updateQuoteAction(
  id: number,
  _previous: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const values = quoteValuesFromFormData(formData);

  const fieldErrors = validateQuoteValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(toUpdateQuotePayload(values)),
      })
    );
  } catch (error) {
    return quoteFailure(error, values, 'Ce devis ou ce client n’existe plus.');
  }

  redirect(`/devis/${id}`);
}

export async function addLineAction(
  quoteId: number,
  _previous: LineFormState,
  formData: FormData
): Promise<LineFormState> {
  const values = lineValuesFromFormData(formData);

  const fieldErrors = validateLineValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/quotes/${quoteId}/lines`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(toLinePayload(values)),
      })
    );
  } catch (error) {
    return lineFailure(error, values);
  }

  redirect(`/devis/${quoteId}`);
}

export async function updateLineAction(
  quoteId: number,
  lineId: number,
  _previous: LineFormState,
  formData: FormData
): Promise<LineFormState> {
  const values = lineValuesFromFormData(formData);

  const fieldErrors = validateLineValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/quotes/${quoteId}/lines/${lineId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(toLinePayload(values)),
      })
    );
  } catch (error) {
    return lineFailure(error, values);
  }

  redirect(`/devis/${quoteId}`);
}

// Formulaire sans état : après la suppression, on revient à la fiche, qui montre la situation
// réelle. Une ligne déjà supprimée (404) ou un devis devenu non modifiable (409) y apparaît tel quel.
export async function deleteLineAction(
  quoteId: number,
  lineId: number
): Promise<void> {
  try {
    await orLogin(
      apiFetchPrivate(`/api/quotes/${quoteId}/lines/${lineId}`, {
        method: 'DELETE',
      })
    );
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      (error.status !== 404 && error.status !== 409)
    ) {
      throw error;
    }
  }

  redirect(`/devis/${quoteId}`);
}
