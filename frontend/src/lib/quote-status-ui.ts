import type { QuoteStatus } from '@/lib/labels';
import { messageForCode } from '@/lib/messages';

// Changements de statut qu'un utilisateur peut demander. Le passage à « expiré » est posé par
// l'API à la consultation, jamais demandé : le corps de PATCH /status refuse cette valeur.
export type StatusTarget = 'sent' | 'accepted' | 'rejected';

export type StatusActionState = { message?: string };

export type StatusChange = {
  target: StatusTarget;
  label: string; // bouton du premier clic
  question: string; // texte affiché avant la confirmation
  confirmLabel: string; // bouton du second clic
};

export const STATUS_CHANGES: Record<StatusTarget, StatusChange> = {
  sent: {
    target: 'sent',
    label: 'Marquer comme envoyé',
    question: 'Marquer ce devis comme envoyé ? Il ne pourra plus être modifié.',
    confirmLabel: 'Confirmer l’envoi',
  },
  accepted: {
    target: 'accepted',
    label: 'Marquer comme accepté',
    question: 'Marquer ce devis comme accepté ? Ce choix est définitif.',
    confirmLabel: 'Confirmer l’acceptation',
  },
  rejected: {
    target: 'rejected',
    label: 'Marquer comme refusé',
    question: 'Marquer ce devis comme refusé ? Ce choix est définitif.',
    confirmLabel: 'Confirmer le refus',
  },
};

const TARGETS_BY_STATUS: Record<QuoteStatus, StatusTarget[]> = {
  draft: ['sent'],
  sent: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
  expired: [],
};

export function statusChangesFor(status: QuoteStatus): StatusChange[] {
  return TARGETS_BY_STATUS[status].map((target) => STATUS_CHANGES[target]);
}

// La duplication ne s'adresse qu'aux devis dont le statut est définitif.
const DUPLICABLE: QuoteStatus[] = ['accepted', 'rejected', 'expired'];

export function canDuplicate(status: QuoteStatus): boolean {
  return DUPLICABLE.includes(status);
}

export const NO_LINES_EXPLANATION =
  'Ajoutez au moins une ligne avant de marquer ce devis comme envoyé.';

export const QUOTE_NOT_FOUND_MESSAGE = 'Ce devis n’existe plus.';

const STATUS_CHANGED_MESSAGE =
  'Le statut de ce devis a changé entre-temps. Rechargez la page pour voir la situation actuelle.';

// Textes d'erreur 409 de l'API (code CONFLICT pour tous) : seul le message les distingue.
export function conflictMessage(apiMessage: string): string {
  if (apiMessage === 'A quote without lines cannot be sent') {
    return 'Un devis sans ligne ne peut pas être envoyé. Ajoutez au moins une ligne.';
  }
  if (apiMessage === 'Quote validity date is in the past') {
    return 'La date de validité est dépassée. Modifiez-la avant de marquer le devis comme envoyé.';
  }
  if (
    apiMessage === 'Quote status has changed, please reload' ||
    apiMessage.startsWith('Cannot change quote status from ')
  ) {
    return STATUS_CHANGED_MESSAGE;
  }
  if (apiMessage === 'Could not allocate a quote reference, please retry') {
    return 'Impossible d’attribuer une référence à la copie. Réessayez.';
  }
  return messageForCode();
}
