import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LineForm } from '@/components/quotes/LineForm';
import { ApiError } from '@/lib/errors';
import { QUOTE_STATUS_LABELS } from '@/lib/labels';
import { lineValuesFromLine } from '@/lib/line-form';
import { parseId } from '@/lib/params';
import { getQuote } from '@/lib/quotes';
import { orLogin } from '@/lib/session-guard';
import { updateLineAction } from '../../../../actions';

type Params = Promise<{ id: string; lineId: string }>;

export default function EditLinePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement de la ligne…
        </p>
      }
    >
      <EditLineContent params={params} />
    </Suspense>
  );
}

async function EditLineContent({ params }: { params: Params }) {
  const raw = await params;
  const quoteId = parseId(raw.id);
  const lineId = parseId(raw.lineId);
  if (quoteId === undefined || lineId === undefined) {
    notFound();
  }

  let quote;
  try {
    quote = await orLogin(getQuote(quoteId));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const line = quote.lines.find((candidate) => candidate.id === lineId);
  if (!line) {
    notFound();
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
        Modifier une ligne de{' '}
        <span className="font-mono">{quote.reference}</span>
      </h1>
      <div className="mt-6">
        <LineForm
          action={updateLineAction.bind(null, quote.id, line.id)}
          initialValues={lineValuesFromLine(line)}
          submitLabel="Enregistrer la ligne"
          pendingLabel="Enregistrement…"
          cancelHref={`/devis/${quote.id}`}
        />
      </div>
    </>
  );
}
