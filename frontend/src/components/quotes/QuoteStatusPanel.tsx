import type { Quote } from '@/lib/quotes';
import {
  NO_LINES_EXPLANATION,
  canDuplicate,
  statusChangesFor,
} from '@/lib/quote-status-ui';
import type { StatusActionState, StatusTarget } from '@/lib/quote-status-ui';
import { CreateWorksiteForm } from '@/components/worksites/CreateWorksiteForm';
import { DuplicateForm } from './DuplicateForm';
import { StatusActionForm } from './StatusActionForm';

type Action = (state: StatusActionState) => Promise<StatusActionState>;

type Props = {
  quote: Pick<Quote, 'status' | 'lines'>;
  statusAction: (target: StatusTarget) => Action; // action liée au devis et au statut visé
  duplicateAction: Action;
  worksiteAction: Action; // création du chantier, ou ouverture s'il existe déjà
};

// Composant serveur : la page lui fournit les actions déjà liées au devis.
export function QuoteStatusPanel({
  quote,
  statusAction,
  duplicateAction,
  worksiteAction,
}: Props) {
  // L'API refuse (409) d'envoyer un devis sans ligne : on l'explique au lieu de proposer l'envoi.
  const blockedByNoLines = quote.status === 'draft' && quote.lines.length === 0;
  const changes = blockedByNoLines ? [] : statusChangesFor(quote.status);
  const duplicable = canDuplicate(quote.status);

  return (
    <section aria-labelledby="status-heading">
      <h2 id="status-heading" className="text-lg font-semibold">
        Suivi du devis
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {blockedByNoLines && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {NO_LINES_EXPLANATION}
          </p>
        )}

        {changes.map((change) => (
          <StatusActionForm
            key={change.target}
            action={statusAction(change.target)}
            change={change}
          />
        ))}

        {quote.status === 'accepted' && (
          <CreateWorksiteForm action={worksiteAction} />
        )}

        {duplicable && <DuplicateForm action={duplicateAction} />}
      </div>
    </section>
  );
}
