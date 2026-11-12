import { Suspense } from 'react';
import { QuoteSearch } from '@/components/quotes/QuoteSearch';
import { QuoteStatusFilter } from '@/components/quotes/QuoteStatusFilter';
import { QuotesTable } from '@/components/quotes/QuotesTable';
import { Pagination } from '@/components/Pagination';
import { firstValue, parsePage, parseSearch } from '@/lib/params';
import { parseQuoteStatus } from '@/lib/quote-params';
import { listQuotes } from '@/lib/quotes';
import { orLogin } from '@/lib/session-guard';

type SearchParams = Promise<{
  search?: string | string[];
  status?: string | string[];
  page?: string | string[];
}>;

export default function QuotesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Devis</h1>
      <Suspense
        fallback={
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Chargement des devis…
          </p>
        }
      >
        <QuotesContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function QuotesContent({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const search = parseSearch(firstValue(raw.search));
  const status = parseQuoteStatus(firstValue(raw.status));
  const page = parsePage(firstValue(raw.page));

  const { quotes, pagination } = await orLogin(
    listQuotes({ status, search, page })
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      <QuoteStatusFilter status={status} search={search} />
      <QuoteSearch search={search} status={status} />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {pagination.total} devis
      </p>
      <QuotesTable quotes={quotes} filtered={Boolean(search || status)} />
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        basePath="/devis"
        params={{ search, status }}
      />
    </div>
  );
}
