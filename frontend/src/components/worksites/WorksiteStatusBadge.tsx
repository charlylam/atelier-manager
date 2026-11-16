import { WORKSITE_STATUS_LABELS } from '@/lib/labels';
import type { WorksiteStatus } from '@/lib/labels';

// Fond clair et texte foncé fixés ensemble : lisible en mode clair comme en mode sombre.
// Le libellé est toujours écrit : la couleur n'est jamais seule à porter le sens.
const STYLES: Record<WorksiteStatus, string> = {
  pending: 'bg-neutral-200 text-neutral-900',
  in_production: 'bg-sky-100 text-sky-900',
  ready: 'bg-amber-100 text-amber-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  canceled: 'bg-red-100 text-red-900',
};

export function WorksiteStatusBadge({ status }: { status: WorksiteStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-sm ${STYLES[status]}`}>
      {WORKSITE_STATUS_LABELS[status]}
    </span>
  );
}
