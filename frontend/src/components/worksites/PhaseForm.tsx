'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Field, FIELD_CLASS, invalidProps } from '@/components/form/Field';
import { phaseInitialState, phaseValuesKey } from '@/lib/phase-form';
import type { PhaseFormState, PhaseFormValues } from '@/lib/phase-form';
import { Button } from '@/components/Button';

type Props = {
  action: (
    state: PhaseFormState,
    formData: FormData
  ) => Promise<PhaseFormState>;
  initialValues: PhaseFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref?: string;
};

// Enveloppe : la clé recrée le formulaire, donc son état, quand les valeurs initiales changent.
// Tant qu'elles sont identiques (par exemple après un refus du serveur), la saisie est conservée.
export function PhaseForm(props: Props) {
  return <PhaseFormBody key={phaseValuesKey(props.initialValues)} {...props} />;
}

function PhaseFormBody({
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    phaseInitialState(initialValues)
  );
  const { values, fieldErrors } = state;

  // Après un envoi, React remet les champs à leur valeur par défaut : on y place les valeurs
  // renvoyées par l'action, pour que la saisie ne soit pas perdue quand le serveur refuse.
  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md bg-red-100 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-200"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="phase-name" label="Nom" error={fieldErrors.name}>
          <input
            id="phase-name"
            name="name"
            required
            maxLength={100}
            defaultValue={values.name}
            {...invalidProps(fieldErrors.name, 'phase-name')}
            className={FIELD_CLASS}
          />
        </Field>

        <Field
          id="phase-estimated-hours"
          label="Heures estimées"
          error={fieldErrors.estimatedHours}
        >
          <input
            id="phase-estimated-hours"
            name="estimatedHours"
            type="number"
            min="0"
            max="9999.99"
            step="0.01"
            inputMode="decimal"
            defaultValue={values.estimatedHours}
            {...invalidProps(
              fieldErrors.estimatedHours,
              'phase-estimated-hours'
            )}
            className={FIELD_CLASS}
          />
        </Field>
      </div>

      <Field id="phase-notes" label="Notes" error={fieldErrors.notes}>
        <textarea
          id="phase-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          defaultValue={values.notes}
          {...invalidProps(fieldErrors.notes, 'phase-notes')}
          className={FIELD_CLASS}
        />
      </Field>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={pending}
          className="font-medium disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className="text-sm underline">
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}
