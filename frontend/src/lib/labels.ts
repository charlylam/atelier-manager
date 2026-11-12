// Libellés français des statuts de l'API.

export const WORKSITE_STATUSES = [
  'pending',
  'in_production',
  'ready',
  'delivered',
  'canceled',
] as const;

export const QUOTE_STATUSES = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
] as const;

export type WorksiteStatus = (typeof WORKSITE_STATUSES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

// Au pluriel : intitulés des compteurs.
export const WORKSITE_STATUS_COUNT_LABELS: Record<WorksiteStatus, string> = {
  pending: 'En attente',
  in_production: 'En fabrication',
  ready: 'Prêts à livrer',
  delivered: 'Livrés',
  canceled: 'Annulés',
};

// Au singulier : statut d'un chantier donné.
export const WORKSITE_STATUS_LABELS: Record<WorksiteStatus, string> = {
  pending: 'En attente',
  in_production: 'En fabrication',
  ready: 'Prêt à livrer',
  delivered: 'Livré',
  canceled: 'Annulé',
};

export const QUOTE_STATUS_COUNT_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillons',
  sent: 'Envoyés',
  accepted: 'Acceptés',
  rejected: 'Refusés',
  expired: 'Expirés',
};

// Au singulier : statut d'un devis donné.
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
};

// Type d'une ligne de devis.
export const QUOTE_LINE_TYPE_LABELS: Record<
  'material' | 'labor' | 'service' | 'other',
  string
> = {
  material: 'Matériau',
  labor: 'Main-d’œuvre',
  service: 'Prestation',
  other: 'Autre',
};
