import { QUOTE_STATUS_LABELS } from '@/lib/labels';
import type { QuoteStatus } from '@/lib/labels';

// Fond clair et texte foncé fixés ensemble : lisible en mode clair comme en mode sombre.
// Le libellé est toujours écrit : la couleur n'est jamais seule à porter le sens.
const STYLES: Record<QuoteStatus, string> = {
  draft: 'bg-neutral-200 text-neutral-900',
  sent: 'bg-sky-100 text-sky-900',
  accepted: 'bg-emerald-100 text-emerald-900',
  rejected: 'bg-red-100 text-red-900',
  expired: 'bg-amber-100 text-amber-900',
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-sm ${STYLES[status]}`}>
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
