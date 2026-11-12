import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  formatDate,
  formatMoney,
  formatPercent,
  formatQuantity,
} from '@/lib/format';
import { QUOTE_LINE_TYPE_LABELS } from '@/lib/labels';
import type { Quote } from '@/lib/quotes';
import { QuoteStatusBadge } from './QuoteStatusBadge';

const EMPTY = '—';

export function QuoteDetailView({
  quote,
  actions,
}: {
  quote: Quote;
  actions?: ReactNode; // à côté du titre (télécharger le PDF)
}) {
  return (
    <>
      <p className="text-sm">
        <Link href="/devis" className="underline">
          ← Devis
        </Link>
      </p>

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold">
          <span className="font-mono">{quote.reference}</span> · {quote.title}
        </h1>
        <QuoteStatusBadge status={quote.status} />
        {actions && <div className="ml-auto">{actions}</div>}
      </div>

      <dl className="mt-6 grid max-w-xl grid-cols-[9rem_1fr] gap-y-2 text-sm">
        <dt className="text-neutral-600 dark:text-neutral-400">Client</dt>
        <dd>
          <Link href={`/clients/${quote.client.id}`} className="underline">
            {quote.client.name}
          </Link>{' '}
          <span className="text-neutral-600 dark:text-neutral-400">
            ({quote.client.code})
          </span>
        </dd>
        <dt className="text-neutral-600 dark:text-neutral-400">
          Valable jusqu’au
        </dt>
        <dd>{quote.validUntil ? formatDate(quote.validUntil) : EMPTY}</dd>
        <dt className="text-neutral-600 dark:text-neutral-400">Description</dt>
        <dd className="whitespace-pre-line">{quote.description ?? EMPTY}</dd>
      </dl>

      <section aria-labelledby="lines-heading" className="mt-8">
        <h2 id="lines-heading" className="text-lg font-semibold">
          Lignes
        </h2>

        {quote.lines.length === 0 ? (
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Aucune ligne.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Lignes du devis</caption>
            <thead>
              <tr className="border-b border-neutral-300 dark:border-neutral-700">
                <th scope="col" className="py-2 pr-3">
                  Désignation
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Quantité
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  Prix unitaire HT
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  TVA
                </th>
                <th scope="col" className="py-2 text-right">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-neutral-200 dark:border-neutral-800"
                >
                  <td className="py-2 pr-3">
                    {line.label}
                    <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                      {QUOTE_LINE_TYPE_LABELS[line.type]}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatQuantity(line.quantity)} {line.unit}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatMoney(line.unitPrice)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {formatPercent(line.vatRate)}
                  </td>
                  <td className="py-2 text-right">
                    {formatMoney(line.totalExclTax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <dl className="mt-4 ml-auto grid max-w-xs grid-cols-2 gap-y-1 text-sm">
          <dt className="text-neutral-600 dark:text-neutral-400">Total HT</dt>
          <dd className="text-right">
            {formatMoney(quote.totals.totalExclTax)}
          </dd>
          <dt className="text-neutral-600 dark:text-neutral-400">TVA</dt>
          <dd className="text-right">{formatMoney(quote.totals.totalVat)}</dd>
          <dt className="font-semibold">Total TTC</dt>
          <dd className="text-right text-base font-semibold">
            {formatMoney(quote.totals.totalInclTax)}
          </dd>
        </dl>
      </section>
    </>
  );
}
