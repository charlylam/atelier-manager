import type { PhaseStatus } from './labels';

export type PhaseStatusChange = {
  target: PhaseStatus;
  label: string; // texte du bouton
};

// Mêmes transitions que l'API (PHASE_TRANSITIONS) : l'API reste seule juge et refuse (409).
// Une phase terminée se rouvre, elle ne repasse pas directement à « à faire ».
const CHANGES: Record<PhaseStatus, PhaseStatusChange[]> = {
  todo: [{ target: 'in_progress', label: 'Démarrer' }],
  in_progress: [
    { target: 'done', label: 'Terminer' },
    { target: 'todo', label: 'Remettre à faire' },
  ],
  done: [{ target: 'in_progress', label: 'Rouvrir' }],
};

export function phaseStatusChangesFor(
  status: PhaseStatus
): PhaseStatusChange[] {
  return CHANGES[status];
}

export const PHASE_GONE_MESSAGE = 'Cette phase n’existe plus.';

export const PROGRESS_LOCKED_MESSAGE =
  'L’avancement des phases ne peut être renseigné que pour un chantier en fabrication.';

const PHASE_STATUS_CHANGED_MESSAGE =
  'Le statut de cette phase a changé entre-temps. Rechargez la page pour voir la situation actuelle.';

export function phaseStatusConflictMessage(apiMessage: string): string {
  if (apiMessage.startsWith('Cannot change phase status from ')) {
    return PHASE_STATUS_CHANGED_MESSAGE;
  }
  return PROGRESS_LOCKED_MESSAGE;
}

export const HOURS_MESSAGE =
  'Nombre d’heures invalide : 4 chiffres au plus, avec 2 décimales au plus.';

// Temps réel passé sur une phase : l'état garde la saisie quand l'API refuse.
export type PhaseHoursState = { message?: string; value: string };

export const ORDER_CHANGED_MESSAGE =
  'La liste des phases a changé entre-temps. Rechargez la page.';
