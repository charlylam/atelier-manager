import type { PhaseStatus, WorksiteStatus } from '@prisma/client';

// Transitions autorisées d'un chantier. Le passage à "ready" exige en plus que
// toutes les phases soient terminées (vérifié dans le service).
export const WORKSITE_TRANSITIONS: Record<WorksiteStatus, WorksiteStatus[]> = {
  pending: ['in_production', 'canceled'],
  in_production: ['ready', 'canceled'],
  ready: ['delivered', 'canceled'],
  delivered: [],
  canceled: [],
};

export function canTransitionWorksite(
  from: WorksiteStatus,
  to: WorksiteStatus
): boolean {
  return WORKSITE_TRANSITIONS[from].includes(to);
}

// Transitions autorisées d'une phase. Une phase terminée peut être rouverte,
// pas remise à faire directement.
export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
  todo: ['in_progress'],
  in_progress: ['done', 'todo'],
  done: ['in_progress'],
};

export function canTransitionPhase(
  from: PhaseStatus,
  to: PhaseStatus
): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}

// Statuts du chantier dans lesquels chaque famille de modifications est permise.
// Structure des phases (ajout, suppression, ordre, estimation, affectation).
export const STRUCTURE_EDITABLE: WorksiteStatus[] = [
  'pending',
  'in_production',
];
// Avancement des phases (statut, temps réel passé).
export const PROGRESS_EDITABLE: WorksiteStatus[] = ['in_production'];
// Informations du chantier (titre, description, adresse, échéance).
export const DETAILS_EDITABLE: WorksiteStatus[] = [
  'pending',
  'in_production',
  'ready',
];
