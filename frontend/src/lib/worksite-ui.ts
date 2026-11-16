import { messageForCode } from '@/lib/messages';

export const QUOTE_NOT_FOUND_MESSAGE = 'Ce devis n’existe plus.';

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
