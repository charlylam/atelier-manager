import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { Worksite } from '@/lib/worksites';
import { PhasesTable } from './PhasesTable';
import { WorksiteStatusBadge } from './WorksiteStatusBadge';

const EMPTY = '—';

function siteLabel(worksite: Worksite) {
  if (worksite.siteAddress) {
    return worksite.siteAddress;
  }
  // Adresse du chantier vide : le chantier a lieu chez le client.
  return worksite.client.address
    ? `${worksite.client.address} (adresse du client)`
    : EMPTY;
}

type Props = {
  worksite: Worksite;
  statusPanel?: ReactNode; // après les phases (changer le statut)
};

export function WorksiteDetailView({ worksite, statusPanel }: Props) {
  return (
    <>
      <p className="text-sm">
        <Link href="/chantiers" className="underline">
          ← Chantiers
        </Link>
      </p>

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold">
          <span className="font-mono">{worksite.reference}</span> ·{' '}
          {worksite.title}
        </h1>
        <WorksiteStatusBadge status={worksite.status} />
      </div>

      <dl className="mt-6 grid max-w-xl grid-cols-[9rem_1fr] gap-y-2 text-sm">
        <dt className="text-neutral-600 dark:text-neutral-400">Client</dt>
        <dd>
          <Link href={`/clients/${worksite.client.id}`} className="underline">
            {worksite.client.name}
          </Link>{' '}
          <span className="text-neutral-600 dark:text-neutral-400">
            ({worksite.client.code})
          </span>
        </dd>
        <dt className="text-neutral-600 dark:text-neutral-400">Devis</dt>
        <dd>
          <Link
            href={`/devis/${worksite.quote.id}`}
            className="font-mono underline"
          >
            {worksite.quote.reference}
          </Link>
        </dd>
        <dt className="text-neutral-600 dark:text-neutral-400">Échéance</dt>
        <dd>{worksite.dueDate ? formatDate(worksite.dueDate) : EMPTY}</dd>
        <dt className="text-neutral-600 dark:text-neutral-400">
          Lieu du chantier
        </dt>
        <dd>{siteLabel(worksite)}</dd>
        <dt className="text-neutral-600 dark:text-neutral-400">Description</dt>
        <dd className="whitespace-pre-line">{worksite.description ?? EMPTY}</dd>
      </dl>

      <section aria-labelledby="phases-heading" className="mt-8">
        <h2 id="phases-heading" className="text-lg font-semibold">
          Phases
        </h2>
        <PhasesTable phases={worksite.phases} totals={worksite.totals} />
      </section>

      {statusPanel && <div className="mt-8">{statusPanel}</div>}
    </>
  );
}
