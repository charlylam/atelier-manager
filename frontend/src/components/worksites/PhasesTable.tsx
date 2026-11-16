import { formatQuantity } from '@/lib/format';
import { PHASE_STATUS_LABELS } from '@/lib/labels';
import type { Worksite } from '@/lib/worksites';

const EMPTY = '—';

const hours = (value: string) => `${formatQuantity(value)} h`;

export function PhasesTable({
  phases,
  totals,
}: Pick<Worksite, 'phases' | 'totals'>) {
  if (phases.length === 0) {
    return (
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Aucune phase.
      </p>
    );
  }

  return (
    <>
      <table className="mt-3 w-full text-left text-sm">
        <caption className="sr-only">Phases du chantier, dans l’ordre</caption>
        <thead>
          <tr className="border-b border-neutral-300 dark:border-neutral-700">
            <th scope="col" className="py-2 pr-3">
              Phase
            </th>
            <th scope="col" className="py-2 pr-3">
              Statut
            </th>
            <th scope="col" className="py-2 pr-3 text-right">
              Heures estimées
            </th>
            <th scope="col" className="py-2 pr-3 text-right">
              Heures réelles
            </th>
            <th scope="col" className="py-2">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {phases.map((phase) => (
            <tr
              key={phase.id}
              className="border-b border-neutral-200 dark:border-neutral-800"
            >
              <td className="py-2 pr-3">
                <span className="mr-2 text-neutral-600 dark:text-neutral-400">
                  {phase.position}.
                </span>
                {phase.name}
              </td>
              <td className="py-2 pr-3">{PHASE_STATUS_LABELS[phase.status]}</td>
              <td className="py-2 pr-3 text-right">
                {hours(phase.estimatedHours)}
              </td>
              <td className="py-2 pr-3 text-right">
                {hours(phase.actualHours)}
              </td>
              <td className="py-2 whitespace-pre-line">
                {phase.notes ?? EMPTY}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="mt-4 ml-auto grid max-w-xs grid-cols-2 gap-y-1 text-sm">
        <dt className="text-neutral-600 dark:text-neutral-400">Total estimé</dt>
        <dd className="text-right">{hours(totals.estimatedHours)}</dd>
        <dt className="text-neutral-600 dark:text-neutral-400">Total réel</dt>
        <dd className="text-right">{hours(totals.actualHours)}</dd>
      </dl>
    </>
  );
}
