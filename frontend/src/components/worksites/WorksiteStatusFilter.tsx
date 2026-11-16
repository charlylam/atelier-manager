import Link from 'next/link';
import { WORKSITE_STATUSES, WORKSITE_STATUS_COUNT_LABELS } from '@/lib/labels';
import type { WorksiteStatus } from '@/lib/labels';
import { pageHref } from '@/lib/pagination';

// Un lien par statut : le filtre vit dans l'URL, et la recherche en cours est conservée.
export function WorksiteStatusFilter({
  status,
  search,
}: {
  status?: WorksiteStatus;
  search?: string;
}) {
  const choices: { value?: WorksiteStatus; label: string }[] = [
    { label: 'Tous' },
    ...WORKSITE_STATUSES.map((value) => ({
      value,
      label: WORKSITE_STATUS_COUNT_LABELS[value],
    })),
  ];

  return (
    <nav
      aria-label="Filtrer par statut"
      className="flex flex-wrap gap-2 text-sm"
    >
      {choices.map(({ value, label }) => {
        const active = value === status;

        return (
          <Link
            key={label}
            href={pageHref('/chantiers', { search, status: value }, 1)}
            aria-current={active ? 'true' : undefined}
            className={
              active
                ? 'rounded-full bg-emerald-800 px-3 py-1 font-medium text-white'
                : 'rounded-full border border-neutral-300 dark:border-neutral-700 px-3 py-1'
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
