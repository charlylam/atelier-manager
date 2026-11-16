'use client';

import { useActionState } from 'react';
import type { StatusActionState } from '@/lib/quote-status-ui';

type Props = {
  action: (state: StatusActionState) => Promise<StatusActionState>;
  label: string; // « Terminer »
  name: string; // nom de la phase, pour le nom accessible du bouton
};

// Un seul clic : le changement de statut d'une phase se défait (une phase terminée se rouvre).
export function PhaseStatusForm({ action, label, name }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        aria-label={`${label} la phase ${name}`}
        className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm disabled:opacity-60"
      >
        {label}
      </button>
      {state.message && (
        <p
          role="alert"
          className="max-w-xs rounded-md bg-red-100 dark:bg-red-950 p-2 text-left text-sm text-red-900 dark:text-red-200"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
