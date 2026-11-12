'use client';

import { useActionState } from 'react';
import type { DeleteClientState } from '@/app/(app)/clients/actions';

type Props = {
  action: (state: DeleteClientState) => Promise<DeleteClientState>;
  clientName: string;
};

// <details> : la confirmation s'ouvre sans JavaScript, et la suppression exige un second clic.
export function DeleteClientForm({ action, clientName }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <details className="rounded-md border border-red-300 dark:border-red-800 p-4">
      <summary className="cursor-pointer font-medium text-red-800 dark:text-red-400">
        Supprimer ce client
      </summary>

      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <p className="text-sm">
          La suppression de <strong>{clientName}</strong> est définitive. Elle
          est refusée si le client a des devis ou des chantiers.
        </p>

        {state.message && (
          <p
            role="alert"
            className="rounded-md bg-red-100 p-3 text-sm text-red-900"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Suppression…' : 'Confirmer la suppression'}
        </button>
      </form>
    </details>
  );
}
