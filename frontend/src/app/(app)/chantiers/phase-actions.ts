'use server';

import { redirect } from 'next/navigation';
import { apiFetchPrivate } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { messageForCode } from '@/lib/messages';
import {
  PHASE_STRUCTURE_MESSAGE,
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

// Échec de l'ajout : on garde la saisie, et on place les champs refusés par l'API. Toute autre
// erreur que celles de l'API est relancée : c'est notamment la redirection vers la connexion
// lancée par orLogin quand la session a expiré.
function addFailure(
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
    return { message: WORKSITE_NOT_FOUND_MESSAGE, fieldErrors: {}, values };
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
    return addFailure(error, values);
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
