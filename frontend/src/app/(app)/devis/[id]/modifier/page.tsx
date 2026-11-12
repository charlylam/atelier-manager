import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { listClients } from '@/lib/clients';
import { ApiError } from '@/lib/errors';
import { QUOTE_STATUS_LABELS } from '@/lib/labels';
import { parseId } from '@/lib/params';
import { quoteValuesFromQuote } from '@/lib/quote-form';
import { getQuote } from '@/lib/quotes';
import { orLogin } from '@/lib/session-guard';
import { updateQuoteAction } from '../../actions';

type Params = Promise<{ id: string }>;

export default function EditQuotePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du devis…
        </p>
      }
    >
      <EditQuoteContent params={params} />
    </Suspense>
  );
}

async function EditQuoteContent({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (id === undefined) {
    notFound();
  }

  let quote, clients;
  try {
    [quote, { clients }] = await orLogin(
      Promise.all([getQuote(id), listClients({ limit: 100 })])
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (quote.status !== 'draft') {
    return (
      <>
        <h1 className="text-2xl font-semibold">{quote.reference}</h1>
        <p className="mt-2">
          Ce devis est « {QUOTE_STATUS_LABELS[quote.status].toLowerCase()} » :
          seul un brouillon peut être modifié.
        </p>
        <p className="mt-4">
          <Link href={`/devis/${quote.id}`} className="underline">
            Retour au devis
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Modifier <span className="font-mono">{quote.reference}</span>
      </h1>
      <div className="mt-6">
        <QuoteForm
          action={updateQuoteAction.bind(null, quote.id)}
          initialValues={quoteValuesFromQuote(quote)}
          clients={clients}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref={`/devis/${quote.id}`}
        />
      </div>
    </>
  );
}
