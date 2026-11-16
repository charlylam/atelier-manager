'use client';

import { useActionState } from 'react';
import type { StatusActionState } from '@/lib/quote-status-ui';

type Props = {
  action: (state: StatusActionState) => Promise<StatusActionState>;
};

// Un seul clic : la copie est un nouveau brouillon, le devis d'origine reste inchangé.
export function DuplicateForm({ action }: Props) {
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
        className="self-start rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? 'Copie en cours…' : 'Dupliquer ce devis'}
      </button>
    </form>
  );
}
