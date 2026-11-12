import { WORKSITE_STATUS_LABELS } from '@/lib/labels';
import { formatDate } from '@/lib/format';
import type { Dashboard } from '@/lib/dashboard';

export function LateWorksites({
  late,
}: {
  late: Dashboard['worksites']['late'];
}) {
  const hidden = late.total - late.items.length;

  return (
    <section aria-labelledby="late-heading">
      <h2 id="late-heading" className="text-lg font-semibold">
        Chantiers en retard
        {late.total > 0 && (
          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-900">
            {late.total}
          </span>
        )}
      </h2>

      {late.total === 0 ? (
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Aucun chantier en retard.
        </p>
      ) : (
        <>
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">
              Chantiers dont l’échéance est dépassée, du plus ancien au plus
              récent
            </caption>
            <thead>
              <tr className="border-b border-neutral-300 dark:border-neutral-700">
                <th scope="col" className="py-2 pr-3">
                  Référence
                </th>
                <th scope="col" className="py-2 pr-3">
                  Chantier
                </th>
                <th scope="col" className="py-2 pr-3">
                  Client
                </th>
                <th scope="col" className="py-2 pr-3">
                  Échéance
                </th>
                <th scope="col" className="py-2 pr-3">
                  Retard
                </th>
                <th scope="col" className="py-2">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {late.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-neutral-200 dark:border-neutral-800"
                >
                  <td className="py-2 pr-3 font-mono">{item.reference}</td>
                  <td className="py-2 pr-3">{item.title}</td>
                  <td className="py-2 pr-3">
                    {item.client.name}
                    <span className="ml-1 text-neutral-500 dark:text-neutral-400">
                      ({item.client.code})
                    </span>
                  </td>
                  <td className="py-2 pr-3">{formatDate(item.dueDate)}</td>
                  <td className="py-2 pr-3 font-medium text-red-800 dark:text-red-400">
                    {item.daysLate} {item.daysLate > 1 ? 'jours' : 'jour'}
                  </td>
                  <td className="py-2">
                    {WORKSITE_STATUS_LABELS[item.status]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hidden > 0 && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              et {hidden} {hidden > 1 ? 'autres' : 'autre'}
            </p>
          )}
        </>
      )}
    </section>
  );
}
