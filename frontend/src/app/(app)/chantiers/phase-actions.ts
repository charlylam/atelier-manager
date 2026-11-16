'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import { normalizeDecimal } from '@/lib/line-form';
import {
  HOURS_MESSAGE,
  PHASE_GONE_MESSAGE,
  phaseStatusConflictMessage,
} from '@/lib/phase-progress';
import type { PhaseHoursState } from '@/lib/phase-progress';
import type { StatusActionState } from '@/lib/quote-status-ui';
import type { PhaseStatus } from '@/lib/labels';
import {
  PHASE_STRUCTURE_MESSAGE,
  isValidHours,
  toUpdatePhasePayload,
  phaseFieldErrorsFromApi,
  phaseValuesFromFormData,
  toCreatePhasePayload,
  validatePhaseValues,
} from '@/lib/phase-form';
import type { PhaseFormState } from '@/lib/phase-form';
import { orLogin } from '@/lib/session-guard';
import { WORKSITE_NOT_FOUND_MESSAGE } from '@/lib/worksite-ui';

// Chaque action est joignable par une requête POST directe : l'API vérifie le jeton, l'atelier
// et le statut du chantier à chaque appel (apiFetchPrivate), les actions n'ont rien à contourner.

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// L'API distingue le chantier et la phase manquants par le texte seul (404 pour les deux).
function notFoundMessage(apiMessage: string) {
  return apiMessage === 'Phase not found'
    ? PHASE_GONE_MESSAGE
    : WORKSITE_NOT_FOUND_MESSAGE;
}

// Échec de l'ajout ou de la modification de la structure : on garde la saisie, et on place les
// champs refusés par l'API. Toute autre erreur que celles de l'API est relancée : c'est notamment
// la redirection vers la connexion lancée par orLogin quand la session a expiré.
function structureFailure(
  error: unknown,
  values: PhaseFormState['values']
): PhaseFormState {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.code === 'VALIDATION_ERROR') {
    return {
      message: messageForCode('VALIDATION_ERROR'),
      fieldErrors: phaseFieldErrorsFromApi(error.details),
      values,
    };
  }
  // Le seul 409 de cette route : chantier ni en attente ni en fabrication.
  if (error.status === 409) {
    return { message: PHASE_STRUCTURE_MESSAGE, fieldErrors: {}, values };
  }
  if (error.status === 404) {
    return {
      message: notFoundMessage(error.message),
      fieldErrors: {},
      values,
    };
  }
  return { message: messageForCode(error.code), fieldErrors: {}, values };
}

export async function addPhaseAction(
  worksiteId: number,
  _previous: PhaseFormState,
  formData: FormData
): Promise<PhaseFormState> {
  const values = phaseValuesFromFormData(formData);

  const fieldErrors = validatePhaseValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toCreatePhasePayload(values)),
      })
    );
  } catch (error) {
    return structureFailure(error, values);
  }

  redirect(`/chantiers/${worksiteId}`);
}

// Même traitement pour l'ajout et la modification de la structure d'une phase : seul l'appel change.
export async function updatePhaseAction(
  worksiteId: number,
  phaseId: number,
  _previous: PhaseFormState,
  formData: FormData
): Promise<PhaseFormState> {
  const values = phaseValuesFromFormData(formData);

  const fieldErrors = validatePhaseValues(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, values };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/phases/${phaseId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(toUpdatePhasePayload(values)),
      })
    );
  } catch (error) {
    return structureFailure(error, values);
  }

  redirect(`/chantiers/${worksiteId}`);
}

// Message d'un refus de l'avancement. Les autres erreurs que celles de l'API sont relancées.
function progressFailure(error: unknown): string {
  if (!(error instanceof ApiError)) {
    throw error;
  }
  if (error.status === 404) {
    return notFoundMessage(error.message);
  }
  if (error.status === 409) {
    return phaseStatusConflictMessage(error.message);
  }
  return messageForCode(error.code);
}

export async function changePhaseStatusAction(
  worksiteId: number,
  phaseId: number,
  target: PhaseStatus
): Promise<StatusActionState> {
  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/phases/${phaseId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ status: target }),
      })
    );
  } catch (error) {
    return { message: progressFailure(error) };
  }

  redirect(`/chantiers/${worksiteId}`);
}

export async function changePhaseHoursAction(
  worksiteId: number,
  phaseId: number,
  _previous: PhaseHoursState,
  formData: FormData
): Promise<PhaseHoursState> {
  const raw = formData.get('actualHours');
  const value = normalizeDecimal(typeof raw === 'string' ? raw : '');

  if (!isValidHours(value)) {
    return { message: HOURS_MESSAGE, value };
  }

  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/phases/${phaseId}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ actualHours: value }),
      })
    );
  } catch (error) {
    return { message: progressFailure(error), value };
  }

  redirect(`/chantiers/${worksiteId}`);
}

// Formulaire sans état : l'ordre complet est calculé par la page. En cas de refus (chantier plus
// modifiable, phase ajoutée ou supprimée entre-temps), on revient à la fiche, qui montre la
// situation réelle.
export async function movePhaseAction(
  worksiteId: number,
  phaseIds: number[]
): Promise<void> {
  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/phases/order`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify({ phaseIds }),
      })
    );
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      ![400, 404, 409].includes(error.status)
    ) {
      throw error;
    }
  }

  redirect(`/chantiers/${worksiteId}`);
}

// Formulaire sans état : après la suppression, on revient à la fiche, qui montre la situation
// réelle. Une phase déjà supprimée (404) ou un chantier devenu non modifiable (409) y apparaît
// tel quel.
export async function deletePhaseAction(
  worksiteId: number,
  phaseId: number
): Promise<void> {
  try {
    await orLogin(
      apiFetchPrivate(`/api/worksites/${worksiteId}/phases/${phaseId}`, {
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

  redirect(`/chantiers/${worksiteId}`);
}
