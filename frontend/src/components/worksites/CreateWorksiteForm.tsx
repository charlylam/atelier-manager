'use client';

import { useActionState } from 'react';
import type { StatusActionState } from '@/lib/quote-status-ui';

type Props = {
  action: (state: StatusActionState) => Promise<StatusActionState>;
};

// Un seul clic. Si le devis a déjà un chantier, l'API le renvoie : le bouton sert donc aussi
// à l'ouvrir. L'échéance et l'adresse du chantier se renseignent ensuite, en modifiant le chantier.
export function CreateWorksiteForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.message && (
        <p
          role="alert"
          className="rounded-md bg-red-100 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-200"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 disabled:opacity-60"
      >
        {pending ? 'Ouverture…' : 'Créer ou ouvrir le chantier'}
      </button>
    </form>
  );
}
