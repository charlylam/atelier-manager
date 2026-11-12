import { Suspense } from 'react';
import Link from 'next/link';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { listClients } from '@/lib/clients';
import { EMPTY_QUOTE_VALUES } from '@/lib/quote-form';
import { orLogin } from '@/lib/session-guard';
import { createQuoteAction } from '../actions';

export default function NewQuotePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Nouveau devis</h1>
      <Suspense
        fallback={
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Chargement…
          </p>
        }
      >
        <NewQuoteContent />
      </Suspense>
    </>
  );
}

async function NewQuoteContent() {
  // 100 clients au plus : c'est la limite de l'API par page. Au-delà, il faudra une recherche.
  const { clients } = await orLogin(listClients({ limit: 100 }));

  if (clients.length === 0) {
    return (
      <p className="mt-4">
        Un devis s’adresse à un client :{' '}
        <Link href="/clients/nouveau" className="underline">
          créez d’abord un client
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="mt-6">
      <QuoteForm
        action={createQuoteAction}
        initialValues={EMPTY_QUOTE_VALUES}
        clients={clients}
        submitLabel="Créer le brouillon"
        pendingLabel="Création…"
        cancelHref="/devis"
      />
    </div>
  );
}
