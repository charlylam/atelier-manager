import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhaseForm } from '@/components/worksites/PhaseForm';
import { ApiError } from '@/lib/errors';
import { WORKSITE_STATUS_LABELS } from '@/lib/labels';
import { parseId } from '@/lib/params';
import { phaseValuesFromPhase } from '@/lib/phase-form';
import { orLogin } from '@/lib/session-guard';
import { canEditPhases } from '@/lib/worksite-status-ui';
import { getWorksite } from '@/lib/worksites';
import { updatePhaseAction } from '../../../../phase-actions';

type Params = Promise<{ id: string; phaseId: string }>;

export default function EditPhasePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement de la phase…
        </p>
      }
    >
      <EditPhaseContent params={params} />
    </Suspense>
  );
}

async function EditPhaseContent({ params }: { params: Params }) {
  const raw = await params;
  const id = parseId(raw.id);
  const phaseId = parseId(raw.phaseId);
  if (id === undefined || phaseId === undefined) {
    notFound();
  }

  let worksite;
  try {
    worksite = await orLogin(getWorksite(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const phase = worksite.phases.find((item) => item.id === phaseId);
  if (!phase) {
    notFound();
  }

  if (!canEditPhases(worksite.status)) {
    return (
      <>
        <h1 className="text-2xl font-semibold">{worksite.reference}</h1>
        <p className="mt-2">
          Ce chantier est «{' '}
          {WORKSITE_STATUS_LABELS[worksite.status].toLowerCase()} » : ses phases
          ne peuvent plus être modifiées.
        </p>
        <p className="mt-4">
          <Link href={`/chantiers/${worksite.id}`} className="underline">
            Retour au chantier
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Modifier la phase « {phase.name} » de{' '}
        <span className="font-mono">{worksite.reference}</span>
      </h1>
      <div className="mt-6">
        <PhaseForm
          action={updatePhaseAction.bind(null, worksite.id, phase.id)}
          initialValues={phaseValuesFromPhase(phase)}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref={`/chantiers/${worksite.id}`}
        />
      </div>
    </>
  );
}
