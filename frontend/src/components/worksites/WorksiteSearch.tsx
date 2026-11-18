import Link from 'next/link';
import type { WorksiteStatus } from '@/lib/labels';
import { pageHref } from '@/lib/pagination';
import { Button } from '@/components/Button';

// Formulaire GET : il fonctionne sans JavaScript, garde le filtre de statut (champ caché)
// et remet la pagination à la page 1.
export function WorksiteSearch({
  search,
  status,
}: {
  search?: string;
  status?: WorksiteStatus;
}) {
  return (
    <form
      action="/chantiers"
      method="get"
      role="search"
      className="flex flex-wrap items-center gap-2"
    >
      <label htmlFor="worksite-search" className="sr-only">
        Rechercher un chantier par sa référence ou son titre
      </label>
      <input
        id="worksite-search"
        name="search"
        type="search"
        maxLength={100}
        defaultValue={search}
        placeholder="Référence ou titre"
        className="w-64 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
      />
      {status && <input type="hidden" name="status" value={status} />}
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="text-sm font-medium"
      >
        Rechercher
      </Button>
      {search && (
        <Link
          href={pageHref('/chantiers', { status }, 1)}
          className="text-sm text-neutral-600 dark:text-neutral-400 underline"
        >
          Effacer la recherche
        </Link>
      )}
    </form>
  );
}
