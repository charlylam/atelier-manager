import Link from 'next/link';
import type { QuoteStatus } from '@/lib/labels';
import { pageHref } from '@/lib/pagination';

// Formulaire GET : il fonctionne sans JavaScript, garde le filtre de statut (champ caché)
// et remet la pagination à la page 1.
export function QuoteSearch({
  search,
  status,
}: {
  search?: string;
  status?: QuoteStatus;
}) {
  return (
    <form
      action="/devis"
      method="get"
      role="search"
      className="flex flex-wrap items-center gap-2"
    >
      <label htmlFor="quote-search" className="sr-only">
        Rechercher un devis par sa référence ou son titre
      </label>
      <input
        id="quote-search"
        name="search"
        type="search"
        maxLength={100}
        defaultValue={search}
        placeholder="Référence ou titre"
        className="w-64 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
      />
      {status && <input type="hidden" name="status" value={status} />}
      <button
        type="submit"
        className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white"
      >
        Rechercher
      </button>
      {search && (
        <Link
          href={pageHref('/devis', { status }, 1)}
          className="text-sm text-neutral-600 dark:text-neutral-400 underline"
        >
          Effacer la recherche
        </Link>
      )}
    </form>
  );
}
