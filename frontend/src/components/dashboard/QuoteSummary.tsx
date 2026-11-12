import { QUOTE_STATUSES, QUOTE_STATUS_COUNT_LABELS } from '@/lib/labels';
import { formatMoney } from '@/lib/format';
import type { Dashboard } from '@/lib/dashboard';

export function QuoteSummary({ quotes }: { quotes: Dashboard['quotes'] }) {
  return (
    <section aria-labelledby="quotes-heading">
      <h2 id="quotes-heading" className="text-lg font-semibold">
        Devis
      </h2>

      <p className="mt-3 rounded-md bg-neutral-100 dark:bg-neutral-800 p-3">
        <span className="font-semibold">{quotes.pending.count}</span> devis en
        attente de réponse, pour{' '}
        <span className="font-semibold">
          {formatMoney(quotes.pending.totalInclTax)}
        </span>{' '}
        TTC.
      </p>

      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {QUOTE_STATUSES.map((status) => (
          <li
            key={status}
            className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3"
          >
            <p className="text-2xl font-semibold">{quotes.byStatus[status]}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {QUOTE_STATUS_COUNT_LABELS[status]}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
