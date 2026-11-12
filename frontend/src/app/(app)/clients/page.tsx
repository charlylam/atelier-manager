import { Suspense } from 'react';
import Link from 'next/link';
import { ClientSearch } from '@/components/clients/ClientSearch';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { Pagination } from '@/components/Pagination';
import { listClients } from '@/lib/clients';
import { firstValue, parsePage, parseSearch } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';

type SearchParams = Promise<{
  search?: string | string[];
  page?: string | string[];
}>;

export default function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link
          href="/clients/nouveau"
          className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white"
        >
          Nouveau client
        </Link>
      </div>
      <Suspense
        fallback={
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Chargement des clients…
          </p>
        }
      >
        <ClientsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ClientsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const search = parseSearch(firstValue(raw.search));
  const page = parsePage(firstValue(raw.page));

  const { clients, pagination } = await orLogin(listClients({ search, page }));

  return (
    <div className="mt-4">
      <ClientSearch search={search} />
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        {pagination.total} {pagination.total > 1 ? 'clients' : 'client'}
      </p>
      <ClientsTable clients={clients} search={search} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/clients"
        params={{ search }}
      />
    </div>
  );
}
