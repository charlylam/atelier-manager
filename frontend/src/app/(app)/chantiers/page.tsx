import { Suspense } from 'react';
import { Pagination } from '@/components/Pagination';
import { WorksiteSearch } from '@/components/worksites/WorksiteSearch';
import { WorksiteStatusFilter } from '@/components/worksites/WorksiteStatusFilter';
import { WorksitesTable } from '@/components/worksites/WorksitesTable';
import { firstValue, parsePage, parseSearch } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';
import { parseWorksiteStatus } from '@/lib/worksite-params';
import { listWorksites } from '@/lib/worksites';

type SearchParams = Promise<{
  search?: string | string[];
  status?: string | string[];
  page?: string | string[];
}>;

export default function WorksitesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Chantiers</h1>
      <Suspense
        fallback={
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Chargement des chantiers…
          </p>
        }
      >
        <WorksitesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function WorksitesContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const search = parseSearch(firstValue(raw.search));
  const status = parseWorksiteStatus(firstValue(raw.status));
  const page = parsePage(firstValue(raw.page));

  const { worksites, pagination } = await orLogin(
    listWorksites({ status, search, page })
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      <WorksiteStatusFilter status={status} search={search} />
      <WorksiteSearch search={search} status={status} />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {pagination.total} chantier{pagination.total > 1 ? 's' : ''}
      </p>
      <WorksitesTable
        worksites={worksites}
        filtered={Boolean(search || status)}
      />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/chantiers"
        params={{ search, status }}
      />
    </div>
  );
}
