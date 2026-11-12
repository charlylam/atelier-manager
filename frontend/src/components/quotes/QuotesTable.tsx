import Link from 'next/link';
import { formatDate, formatMoney } from '@/lib/format';
import type { QuoteSummary } from '@/lib/quotes';
import { QuoteStatusBadge } from './QuoteStatusBadge';

export function QuotesTable({
  quotes,
  filtered,
}: {
  quotes: QuoteSummary[];
  filtered: boolean; // une recherche ou un statut est actif
}) {
  if (quotes.length === 0) {
    return (
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">
        {filtered
          ? 'Aucun devis ne correspond à ces critères.'
          : 'Aucun devis.'}
      </p>
    );
  }

  return (
    <table className="mt-4 w-full text-left text-sm">
      <caption className="sr-only">
        Devis de l’atelier, du plus récent au plus ancien
      </caption>
      <thead>
        <tr className="border-b border-neutral-300 dark:border-neutral-700">
          <th scope="col" className="py-2 pr-3">
            Référence
          </th>
          <th scope="col" className="py-2 pr-3">
            Titre
          </th>
          <th scope="col" className="py-2 pr-3">
            Client
          </th>
          <th scope="col" className="py-2 pr-3">
            Statut
          </th>
          <th scope="col" className="py-2 pr-3">
            Valable jusqu’au
          </th>
          <th scope="col" className="py-2 text-right">
            Total TTC
          </th>
        </tr>
      </thead>
      <tbody>
        {quotes.map((quote) => (
          <tr
            key={quote.id}
            className="border-b border-neutral-200 dark:border-neutral-800"
          >
            <td className="py-2 pr-3 font-mono">
              <Link
                href={`/devis/${quote.id}`}
                className="font-medium underline"
              >
                {quote.reference}
              </Link>
            </td>
            <td className="py-2 pr-3">{quote.title}</td>
            <td className="py-2 pr-3">
              <Link href={`/clients/${quote.client.id}`} className="underline">
                {quote.client.name}
              </Link>
            </td>
            <td className="py-2 pr-3">
              <QuoteStatusBadge status={quote.status} />
            </td>
            <td className="py-2 pr-3">
              {quote.validUntil ? formatDate(quote.validUntil) : '—'}
            </td>
            <td className="py-2 text-right">
              {formatMoney(quote.totalInclTax)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
