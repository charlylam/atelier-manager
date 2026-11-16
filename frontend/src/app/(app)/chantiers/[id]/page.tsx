import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhaseActions } from '@/components/worksites/PhaseActions';
import { PhaseForm } from '@/components/worksites/PhaseForm';
import { WorksiteDetailView } from '@/components/worksites/WorksiteDetailView';
import { WorksiteStatusPanel } from '@/components/worksites/WorksiteStatusPanel';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';
import { EMPTY_PHASE_VALUES } from '@/lib/phase-form';
import { orLogin } from '@/lib/session-guard';
import { canEditPhases, canEditWorksite } from '@/lib/worksite-status-ui';
import { getWorksite } from '@/lib/worksites';
import type { Phase } from '@/lib/worksites';
import {
  addPhaseAction,
  changePhaseHoursAction,
  changePhaseStatusAction,
  deletePhaseAction,
  movePhaseAction,
} from '../phase-actions';
import { changeWorksiteStatusAction } from '../status-actions';

type Params = Promise<{ id: string }>;

// Identifiants des phases dans l'ordre demandé : la phase à `index` échange sa place avec sa voisine.
function reordered(phases: Phase[], index: number, direction: 'up' | 'down') {
  const ids = phases.map((phase) => phase.id);
  const other = direction === 'up' ? index - 1 : index + 1;
  [ids[index], ids[other]] = [ids[other], ids[index]];
  return ids;
}

export default function WorksitePage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du chantier…
        </p>
      }
    >
      <WorksiteContent params={params} />
    </Suspense>
  );
}

async function WorksiteContent({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (id === undefined) {
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

  // L'API refuse (409) toute modification de la structure des phases hors des statuts en attente
  // et en fabrication, et de leur avancement hors de la fabrication.
  const phasesEditable = canEditPhases(worksite.status);

  return (
    <WorksiteDetailView
      worksite={worksite}
      actions={
        canEditWorksite(worksite.status) && (
          <Link
            href={`/chantiers/${worksite.id}/modifier`}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm"
          >
            Modifier
          </Link>
        )
      }
      phaseActions={
        phasesEditable
          ? (phase) => {
              const index = worksite.phases.findIndex(
                (item) => item.id === phase.id
              );
              return (
                <PhaseActions
                  worksiteId={worksite.id}
                  phase={phase}
                  isFirst={index === 0}
                  isLast={index === worksite.phases.length - 1}
                  structure
                  progress={worksite.status === 'in_production'}
                  statusAction={(target) =>
                    changePhaseStatusAction.bind(
                      null,
                      worksite.id,
                      phase.id,
                      target
                    )
                  }
                  hoursAction={changePhaseHoursAction.bind(
                    null,
                    worksite.id,
                    phase.id
                  )}
                  moveAction={(direction) =>
                    movePhaseAction.bind(
                      null,
                      worksite.id,
                      reordered(worksite.phases, index, direction)
                    )
                  }
                  deleteAction={deletePhaseAction.bind(
                    null,
                    worksite.id,
                    phase.id
                  )}
                />
              );
            }
          : undefined
      }
      phasesFooter={
        phasesEditable ? (
          <section aria-labelledby="add-phase-heading">
            <h3 id="add-phase-heading" className="text-base font-semibold">
              Ajouter une phase
            </h3>
            <div className="mt-3">
              <PhaseForm
                action={addPhaseAction.bind(null, worksite.id)}
                initialValues={EMPTY_PHASE_VALUES}
                submitLabel="Ajouter la phase"
                pendingLabel="Ajout…"
              />
            </div>
          </section>
        ) : undefined
      }
      statusPanel={
        <WorksiteStatusPanel
          worksite={worksite}
          statusAction={(target) =>
            changeWorksiteStatusAction.bind(null, worksite.id, target)
          }
        />
      }
    />
  );
}
