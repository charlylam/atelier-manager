'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Field, FIELD_CLASS, invalidProps } from '@/components/form/Field';
import { quoteInitialState } from '@/lib/quote-form';
import type { QuoteFormState, QuoteFormValues } from '@/lib/quote-form';

type ClientOption = { id: number; code: string; name: string };

type Props = {
  action: (
    state: QuoteFormState,
    formData: FormData
  ) => Promise<QuoteFormState>;
  initialValues: QuoteFormValues;
  clients: ClientOption[];
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
};

export function QuoteForm({
  action,
  initialValues,
  clients,
  submitLabel,
  pendingLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    quoteInitialState(initialValues)
  );
  const { values, fieldErrors } = state;

  // Après un envoi, React remet les champs à leur valeur par défaut : on y place les valeurs
  // renvoyées par l'action, pour que la saisie ne soit pas perdue quand le serveur refuse.
  // La clé du <select> le recrée quand l'action renvoie un autre choix : React ne met pas à jour
  // une liste déroulante par `defaultValue` après un envoi, contrairement aux champs de texte.
  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-3 text-sm text-red-900"
        >
          {state.message}
        </p>
      )}

      <Field id="quote-client" label="Client" error={fieldErrors.clientId}>
        <select
          id="quote-client"
          name="clientId"
          required
          key={values.clientId}
          defaultValue={values.clientId}
          {...invalidProps(fieldErrors.clientId, 'quote-client')}
          className={FIELD_CLASS}
        >
          <option value="">Choisir un client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.code})
            </option>
          ))}
        </select>
      </Field>

      <Field id="quote-title" label="Titre" error={fieldErrors.title}>
        <input
          id="quote-title"
          name="title"
          required
          maxLength={200}
          defaultValue={values.title}
          {...invalidProps(fieldErrors.title, 'quote-title')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field
        id="quote-description"
        label="Description"
        error={fieldErrors.description}
      >
        <textarea
          id="quote-description"
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={values.description}
          {...invalidProps(fieldErrors.description, 'quote-description')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field
        id="quote-valid-until"
        label="Valable jusqu’au"
        error={fieldErrors.validUntil}
      >
        <input
          id="quote-valid-until"
          name="validUntil"
          type="date"
          defaultValue={values.validUntil}
          {...invalidProps(fieldErrors.validUntil, 'quote-valid-until')}
          className={FIELD_CLASS}
        />
      </Field>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        <Link href={cancelHref} className="text-sm underline">
          Annuler
        </Link>
      </div>
    </form>
  );
}
