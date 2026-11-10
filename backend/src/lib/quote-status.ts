import type { QuoteStatus } from '@prisma/client';

// Transitions autorisées. Seul un brouillon est modifiable.
// Le passage à "expired" est posé par le système, jamais demandé par un client.
export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'rejected', 'expired'],
  accepted: [],
  rejected: [],
  expired: [],
};

export function canTransition(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from].includes(to);
}
