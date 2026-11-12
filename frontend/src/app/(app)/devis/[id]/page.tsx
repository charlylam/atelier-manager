import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { QuoteDetailView } from '@/components/quotes/QuoteDetailView';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';
import { getQuote } from '@/lib/quotes';
import { orLogin } from '@/lib/session-guard';

type Params = Promise<{ id: string }>;

export default function QuotePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du devis…
        </p>
      }
    >
      <QuoteContent params={params} />
    </Suspense>
  );
}

async function QuoteContent({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (id === undefined) {
    notFound();
  }

  let quote;
  try {
    quote = await orLogin(getQuote(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <QuoteDetailView
      quote={quote}
      actions={
        // Lien ordinaire : le PDF est servi par un Route Handler, pas par une page.
        <a
          href={`/devis/${quote.id}/pdf`}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm"
        >
          Télécharger le PDF
        </a>
      }
    />
  );
}
