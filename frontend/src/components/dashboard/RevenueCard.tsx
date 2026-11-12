import { formatMoney } from '@/lib/format';
import { formatMonth } from '@/lib/months';
import type { Dashboard } from '@/lib/dashboard';
import { MonthNav } from './MonthNav';

export function RevenueCard({ revenue }: { revenue: Dashboard['revenue'] }) {
  return (
    <section aria-labelledby="revenue-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="revenue-heading" className="text-lg font-semibold">
          Chiffre d’affaires
        </h2>
        <MonthNav month={revenue.month} />
      </div>

      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Chantiers livrés en {formatMonth(revenue.month)} :{' '}
        <span className="font-medium">{revenue.deliveredWorksites}</span>
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
          <dt className="text-sm text-neutral-600 dark:text-neutral-400">
            Hors taxes
          </dt>
          <dd className="text-xl font-semibold">
            {formatMoney(revenue.totalExclTax)}
          </dd>
        </div>
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
          <dt className="text-sm text-neutral-600 dark:text-neutral-400">
            TVA
          </dt>
          <dd className="text-xl font-semibold">
            {formatMoney(revenue.totalVat)}
          </dd>
        </div>
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
          <dt className="text-sm text-neutral-600 dark:text-neutral-400">
            TTC
          </dt>
          <dd className="text-xl font-semibold">
            {formatMoney(revenue.totalInclTax)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
