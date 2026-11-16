import type { WorksiteStatus } from '@/lib/labels';

// Changements de statut qu'un utilisateur peut demander : le corps de PATCH /status refuse
// « pending », qui est le statut de départ.
export type WorksiteTarget = Exclude<WorksiteStatus, 'pending'>;

export type WorksiteStatusChange = {
  target: WorksiteTarget;
  label: string; // bouton du premier clic
  question: string; // texte affiché avant la confirmation
  confirmLabel: string; // bouton du second clic
};

export const WORKSITE_STATUS_CHANGES: Record<
  WorksiteTarget,
  WorksiteStatusChange
> = {
  in_production: {
    target: 'in_production',
    label: 'Lancer la fabrication',
    question:
      'Lancer la fabrication de ce chantier ? L’avancement des phases pourra ensuite être renseigné.',
    confirmLabel: 'Confirmer le lancement',
  },
  ready: {
    target: 'ready',
    label: 'Marquer comme prêt à livrer',
    question:
      'Marquer ce chantier comme prêt à livrer ? Toutes les phases doivent être terminées, et elles ne pourront plus être modifiées.',
    confirmLabel: 'Confirmer',
  },
  delivered: {
    target: 'delivered',
    label: 'Marquer comme livré',
    question: 'Marquer ce chantier comme livré ? Ce choix est définitif.',
    confirmLabel: 'Confirmer la livraison',
  },
  canceled: {
    target: 'canceled',
    label: 'Annuler le chantier',
    question: 'Annuler ce chantier ? Ce choix est définitif.',
    confirmLabel: 'Confirmer l’annulation',
  },
};

// Mêmes transitions que l'API (WORKSITE_TRANSITIONS) : l'API reste seule juge et refuse (409).
const TARGETS_BY_STATUS: Record<WorksiteStatus, WorksiteTarget[]> = {
  pending: ['in_production', 'canceled'],
  in_production: ['ready', 'canceled'],
  ready: ['delivered', 'canceled'],
  delivered: [],
  canceled: [],
};

export function worksiteStatusChangesFor(
  status: WorksiteStatus
): WorksiteStatusChange[] {
  return TARGETS_BY_STATUS[status].map(
    (target) => WORKSITE_STATUS_CHANGES[target]
  );
}
