import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteLineForm } from '@/components/quotes/DeleteLineForm';
import { LineForm } from '@/components/quotes/LineForm';
import { QuoteDetailView } from '@/components/quotes/QuoteDetailView';
import { ApiError } from '@/lib/errors';
import { DEFAULT_LINE_VALUES } from '@/lib/line-form';
import { parseId } from '@/lib/params';
import { getQuote } from '@/lib/quotes';
import { orLogin } from '@/lib/session-guard';
import { addLineAction, deleteLineAction } from '../actions';

type Params = Promise<{ id: string }>;

const BUTTON =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm';

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

  // Seul un brouillon est modifiable : l'API refuse (409) toute modification d'un autre statut.
  const editable = quote.status === 'draft';

  return (
    <QuoteDetailView
      quote={quote}
      actions={
        <>
          {editable && (
            <Link href={`/devis/${quote.id}/modifier`} className={BUTTON}>
              Modifier
            </Link>
          )}
          {/* Lien ordinaire : le PDF est servi par un Route Handler, pas par une page. */}
          <a href={`/devis/${quote.id}/pdf`} className={BUTTON}>
            Télécharger le PDF
          </a>
        </>
      }
      lineActions={
        editable
          ? (line) => (
              <div className="flex items-center justify-end gap-4">
                <Link
                  href={`/devis/${quote.id}/lignes/${line.id}/modifier`}
                  aria-label={`Modifier la ligne ${line.label}`}
                  className="text-sm underline"
                >
                  Modifier
                </Link>
                <DeleteLineForm
                  action={deleteLineAction.bind(null, quote.id, line.id)}
                  label={line.label}
                />
              </div>
            )
          : undefined
      }
      linesFooter={
        editable ? (
          <section aria-labelledby="add-line-heading">
            <h3 id="add-line-heading" className="text-base font-semibold">
              Ajouter une ligne
            </h3>
            <div className="mt-3">
              <LineForm
                action={addLineAction.bind(null, quote.id)}
                initialValues={DEFAULT_LINE_VALUES}
                submitLabel="Ajouter la ligne"
                pendingLabel="Ajout…"
              />
            </div>
          </section>
        ) : undefined
      }
    />
  );
}
