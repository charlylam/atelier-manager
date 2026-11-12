import { WORKSITE_STATUSES, WORKSITE_STATUS_COUNT_LABELS } from '@/lib/labels';
import type { Dashboard } from '@/lib/dashboard';

export function WorksiteStatusCards({
  counts,
}: {
  counts: Dashboard['worksites']['byStatus'];
}) {
  return (
    <section aria-labelledby="worksites-heading">
      <h2 id="worksites-heading" className="text-lg font-semibold">
        Chantiers
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {WORKSITE_STATUSES.map((status) => (
          <li
            key={status}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3"
          >
            <p className="text-2xl font-semibold">{counts[status]}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {WORKSITE_STATUS_COUNT_LABELS[status]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
