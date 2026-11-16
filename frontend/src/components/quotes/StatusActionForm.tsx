'use client';

import { useActionState } from 'react';
import type { StatusActionState, StatusChange } from '@/lib/quote-status-ui';

// Sert aussi aux chantiers : seuls les trois textes sont utilisés.
type Change = Pick<StatusChange, 'label' | 'question' | 'confirmLabel'>;

type Props = {
  action: (state: StatusActionState) => Promise<StatusActionState>;
  change: Change;
};

// <details>, comme pour la suppression d'un client : le premier clic affiche la question sans
// JavaScript, le second envoie le changement de statut.
export function StatusActionForm({ action, change }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <details className="rounded-md border border-neutral-300 dark:border-neutral-700 p-4">
      <summary className="cursor-pointer font-medium">{change.label}</summary>

      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <p className="text-sm">{change.question}</p>

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
          {pending ? 'Enregistrement…' : change.confirmLabel}
        </button>
      </form>
    </details>
  );
}
