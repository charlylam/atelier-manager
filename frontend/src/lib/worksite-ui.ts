import { messageForCode } from '@/lib/messages';

export const QUOTE_NOT_FOUND_MESSAGE = 'Ce devis n’existe plus.';
export const WORKSITE_NOT_FOUND_MESSAGE = 'Ce chantier n’existe plus.';

const STATUS_CHANGED_MESSAGE =
  'Le statut de ce chantier a changé entre-temps. Rechargez la page pour voir la situation actuelle.';

// Textes d'erreur 409 du changement de statut : seul le message les distingue.
export function worksiteStatusConflictMessage(apiMessage: string): string {
  if (apiMessage === 'All phases must be done before the worksite is ready') {
    return 'Toutes les phases doivent être terminées avant de marquer le chantier comme prêt à livrer.';
  }
  if (
    apiMessage === 'Worksite status has changed, please reload' ||
    apiMessage.startsWith('Cannot change worksite status from ')
  ) {
    return STATUS_CHANGED_MESSAGE;
  }
  return messageForCode();
}

// Textes d'erreur 409 de l'API (code CONFLICT pour tous) : seul le message les distingue.
export function worksiteConflictMessage(apiMessage: string): string {
  if (apiMessage === 'Only an accepted quote can become a worksite') {
    return 'Seul un devis accepté peut devenir un chantier.';
  }
  if (apiMessage === 'Could not allocate a worksite reference, please retry') {
    return 'Impossible d’attribuer une référence au chantier. Réessayez.';
  }
  return messageForCode();
}
