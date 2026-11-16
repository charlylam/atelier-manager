import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { WorksiteSummary } from '@/lib/worksites';
import { WorksiteStatusBadge } from './WorksiteStatusBadge';

export function WorksitesTable({
  worksites,
  filtered,
}: {
  worksites: WorksiteSummary[];
  filtered: boolean; // une recherche ou un statut est actif
}) {
  if (worksites.length === 0) {
    return (
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">
        {filtered
          ? 'Aucun chantier ne correspond à ces critères.'
          : 'Aucun chantier.'}
      </p>
    );
  }

  return (
    <table className="mt-4 w-full text-left text-sm">
      <caption className="sr-only">
        Chantiers de l’atelier, du plus récent au plus ancien
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
            Échéance
          </th>
          <th scope="col" className="py-2 text-right">
            Phases terminées
          </th>
        </tr>
      </thead>
      <tbody>
        {worksites.map((worksite) => (
          <tr
            key={worksite.id}
            className="border-b border-neutral-200 dark:border-neutral-800"
          >
            <td className="py-2 pr-3 font-mono">
              <Link
                href={`/chantiers/${worksite.id}`}
                className="font-medium underline"
              >
                {worksite.reference}
              </Link>
            </td>
            <td className="py-2 pr-3">{worksite.title}</td>
            <td className="py-2 pr-3">
              <Link
                href={`/clients/${worksite.client.id}`}
                className="underline"
              >
                {worksite.client.name}
              </Link>
            </td>
            <td className="py-2 pr-3">
              <WorksiteStatusBadge status={worksite.status} />
            </td>
            <td className="py-2 pr-3">
              {worksite.dueDate ? formatDate(worksite.dueDate) : '—'}
            </td>
            <td className="py-2 text-right">
              {worksite.progress.done} sur {worksite.progress.total}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
