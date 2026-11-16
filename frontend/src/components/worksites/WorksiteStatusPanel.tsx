import { StatusActionForm } from '@/components/quotes/StatusActionForm';
import type { StatusActionState } from '@/lib/quote-status-ui';
import { worksiteStatusChangesFor } from '@/lib/worksite-status-ui';
import type { WorksiteTarget } from '@/lib/worksite-status-ui';
import type { Worksite } from '@/lib/worksites';

type Action = (state: StatusActionState) => Promise<StatusActionState>;

type Props = {
  worksite: Pick<Worksite, 'status'>;
  statusAction: (target: WorksiteTarget) => Action; // action liée au chantier et au statut visé
};

// Composant serveur : la page lui fournit les actions déjà liées au chantier.
// Un chantier livré ou annulé n'a plus de changement possible : rien à afficher.
export function WorksiteStatusPanel({ worksite, statusAction }: Props) {
  const changes = worksiteStatusChangesFor(worksite.status);

  if (changes.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="worksite-status-heading">
      <h2 id="worksite-status-heading" className="text-lg font-semibold">
        Suivi du chantier
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {changes.map((change) => (
          <StatusActionForm
            key={change.target}
            action={statusAction(change.target)}
            change={change}
          />
        ))}
      </div>
    </section>
  );
}
