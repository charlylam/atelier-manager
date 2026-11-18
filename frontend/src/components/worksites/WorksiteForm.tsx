'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Field, FIELD_CLASS, invalidProps } from '@/components/form/Field';
import { worksiteInitialState, worksiteValuesKey } from '@/lib/worksite-form';
import type {
  WorksiteFormState,
  WorksiteFormValues,
} from '@/lib/worksite-form';

type Props = {
  action: (
    state: WorksiteFormState,
    formData: FormData
  ) => Promise<WorksiteFormState>;
  initialValues: WorksiteFormValues;
  cancelHref: string;
};

// Enveloppe : la clé recrée le formulaire, donc son état, quand les valeurs initiales changent.
// Tant qu'elles sont identiques (par exemple après un refus du serveur), la saisie est conservée.
export function WorksiteForm(props: Props) {
  return (
    <WorksiteFormBody key={worksiteValuesKey(props.initialValues)} {...props} />
  );
}

function WorksiteFormBody({ action, initialValues, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    worksiteInitialState(initialValues)
  );
  const { values, fieldErrors } = state;

  // Après un envoi, React remet les champs à leur valeur par défaut : on y place les valeurs
  // renvoyées par l'action, pour que la saisie ne soit pas perdue quand le serveur refuse.
  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md bg-red-100 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-200"
        >
          {state.message}
        </p>
      )}

      <Field id="worksite-title" label="Titre" error={fieldErrors.title}>
        <input
          id="worksite-title"
          name="title"
          required
          maxLength={200}
          defaultValue={values.title}
          {...invalidProps(fieldErrors.title, 'worksite-title')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field
        id="worksite-description"
        label="Description"
        error={fieldErrors.description}
      >
        <textarea
          id="worksite-description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={values.description}
          {...invalidProps(fieldErrors.description, 'worksite-description')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field
        id="worksite-site-address"
        label="Adresse du chantier"
        error={fieldErrors.siteAddress}
      >
        <input
          id="worksite-site-address"
          name="siteAddress"
          maxLength={200}
          defaultValue={values.siteAddress}
          {...invalidProps(fieldErrors.siteAddress, 'worksite-site-address')}
          className={FIELD_CLASS}
        />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Laissez vide si le chantier a lieu à l’adresse du client.
        </p>
      </Field>

      <Field
        id="worksite-due-date"
        label="Échéance"
        error={fieldErrors.dueDate}
      >
        <input
          id="worksite-due-date"
          name="dueDate"
          type="date"
          defaultValue={values.dueDate}
          {...invalidProps(fieldErrors.dueDate, 'worksite-due-date')}
          className={FIELD_CLASS}
        />
      </Field>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <Link href={cancelHref} className="text-sm underline">
          Annuler
        </Link>
      </div>
    </form>
  );
}
