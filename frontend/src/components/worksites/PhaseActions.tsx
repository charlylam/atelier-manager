import Link from 'next/link';
import type { PhaseStatus } from '@/lib/labels';
import { phaseStatusChangesFor } from '@/lib/phase-progress';
import type { PhaseHoursState } from '@/lib/phase-progress';
import type { StatusActionState } from '@/lib/quote-status-ui';
import type { Phase } from '@/lib/worksites';
import { DeletePhaseForm } from './DeletePhaseForm';
import { MovePhaseForm } from './MovePhaseForm';
import { PhaseHoursForm } from './PhaseHoursForm';
import { PhaseStatusForm } from './PhaseStatusForm';

type Props = {
  worksiteId: number;
  phase: Phase;
  isFirst: boolean;
  isLast: boolean;
  structure: boolean; // chantier en attente ou en fabrication : nom, estimation, ordre, suppression
  progress: boolean; // chantier en fabrication : statut et heures réelles
  statusAction: (
    target: PhaseStatus
  ) => (state: StatusActionState) => Promise<StatusActionState>;
  hoursAction: (
    state: PhaseHoursState,
    formData: FormData
  ) => Promise<PhaseHoursState>;
  moveAction: (direction: 'up' | 'down') => () => Promise<void>;
  deleteAction: () => Promise<void>;
};

// Composant serveur : la page lui fournit les actions déjà liées au chantier et à la phase.
export function PhaseActions({
  worksiteId,
  phase,
  isFirst,
  isLast,
  structure,
  progress,
  statusAction,
  hoursAction,
  moveAction,
  deleteAction,
}: Props) {
  return (
    <div className="flex flex-col items-end gap-3">
      {progress && (
        <>
          <div className="flex flex-wrap justify-end gap-2">
            {phaseStatusChangesFor(phase.status).map((change) => (
              <PhaseStatusForm
                key={change.target}
                action={statusAction(change.target)}
                label={change.label}
                name={phase.name}
              />
            ))}
          </div>
          {/* La clé recrée le champ quand les heures changent : React ne met pas à jour un champ
              par defaultValue après un envoi réussi. */}
          <PhaseHoursForm
            key={phase.actualHours}
            action={hoursAction}
            initialValue={phase.actualHours}
            name={phase.name}
          />
        </>
      )}

      {structure && (
        <div className="flex items-center gap-3">
          {!isFirst && (
            <MovePhaseForm
              action={moveAction('up')}
              direction="up"
              name={phase.name}
            />
          )}
          {!isLast && (
            <MovePhaseForm
              action={moveAction('down')}
              direction="down"
              name={phase.name}
            />
          )}
          <Link
            href={`/chantiers/${worksiteId}/phases/${phase.id}/modifier`}
            aria-label={`Modifier la phase ${phase.name}`}
            className="text-sm underline"
          >
            Modifier
          </Link>
          <DeletePhaseForm action={deleteAction} name={phase.name} />
        </div>
      )}
    </div>
  );
}
