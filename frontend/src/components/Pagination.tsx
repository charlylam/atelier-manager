import Link from 'next/link';
import { pageHref } from '@/lib/pagination';

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
};

export function Pagination({ page, totalPages, basePath, params = {} }: Props) {
  if (totalPages <= 1) {
    return null;
  }

  // Si l'URL demande une page au-delà de la dernière, « Précédent » ramène à la dernière.
  const previous = Math.min(page - 1, totalPages);
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center gap-4 text-sm"
    >
      {hasPrevious ? (
        <Link
          href={pageHref(basePath, params, previous)}
          rel="prev"
          className="underline"
        >
          Précédent
        </Link>
      ) : (
        <span
          className="text-neutral-500 dark:text-neutral-400"
          aria-disabled="true"
        >
          Précédent
        </span>
      )}

      <span>
        Page {page} sur {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={pageHref(basePath, params, page + 1)}
          rel="next"
          className="underline"
        >
          Suivant
        </Link>
      ) : (
        <span
          className="text-neutral-500 dark:text-neutral-400"
          aria-disabled="true"
        >
          Suivant
        </span>
      )}
    </nav>
  );
}
