'use client';

import { useActionState } from 'react';
import type { PhaseHoursState } from '@/lib/phase-progress';

type Props = {
  action: (
    state: PhaseHoursState,
    formData: FormData
  ) => Promise<PhaseHoursState>;
  initialValue: string; // heures réelles actuelles
  name: string; // nom de la phase, pour les noms accessibles
};

export function PhaseHoursForm({ action, initialValue, name }: Props) {
  const [state, formAction, pending] = useActionState(action, {
    value: initialValue,
  });
  const inputId = `hours-${name}`;

  // Après un envoi, React remet le champ à sa valeur par défaut : on y place la valeur renvoyée
  // par l'action, pour que la saisie ne soit pas perdue quand le serveur refuse.
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Heures réelles de la phase {name}
        </label>
        <input
          id={inputId}
          name="actualHours"
          type="number"
          required
          min="0"
          max="9999.99"
          step="0.01"
          inputMode="decimal"
          defaultValue={state.value}
          aria-invalid={state.message ? true : undefined}
          className="w-24 rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label={`Enregistrer les heures réelles de la phase ${name}`}
          className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm disabled:opacity-60"
        >
          Enregistrer
        </button>
      </div>
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
