import Link from 'next/link';

// Formulaire GET : il fonctionne sans JavaScript et remet la pagination à la page 1.
export function ClientSearch({ search }: { search?: string }) {
  return (
    <form
      action="/clients"
      method="get"
      role="search"
      className="flex flex-wrap items-center gap-2"
    >
      <label htmlFor="client-search" className="sr-only">
        Rechercher un client par son nom
      </label>
      <input
        id="client-search"
        name="search"
        type="search"
        maxLength={100}
        defaultValue={search}
        placeholder="Rechercher par nom"
        className="w-64 rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white"
      >
        Rechercher
      </button>
      {search && (
        <Link
          href="/clients"
          className="text-sm text-neutral-600 dark:text-neutral-400 underline"
        >
          Effacer la recherche
        </Link>
      )}
    </form>
  );
}
