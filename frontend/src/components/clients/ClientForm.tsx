'use client';

import { useActionState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { initialState } from '@/lib/client-form';
import type {
  ClientField,
  ClientFormState,
  ClientFormValues,
} from '@/lib/client-form';

type Props = {
  action: (
    state: ClientFormState,
    formData: FormData
  ) => Promise<ClientFormState>;
  initialValues: ClientFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref: string;
};

const FIELD_CLASS =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-base font-normal';

// L'erreur est hors du <label> : le nom du champ reste « Adresse e-mail », et le
// message est lu une seule fois, par aria-describedby.
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function ClientForm({
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    initialState(initialValues)
  );
  const { values, fieldErrors } = state;

  // Après un envoi, React remet les champs à leur valeur par défaut : on y place les valeurs
  // renvoyées par l'action, pour que la saisie ne soit pas perdue quand le serveur refuse.
  // Le <select> porte une clé : React ne met pas à jour le choix d'une liste déroulante par
  // `defaultValue` après un envoi (contrairement aux champs de texte), donc on le recrée
  // quand l'action renvoie une autre valeur.
  function invalid(field: ClientField, id: string) {
    return fieldErrors[field]
      ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` }
      : {};
  }

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

      <Field id="client-name" label="Nom" error={fieldErrors.name}>
        <input
          id="client-name"
          name="name"
          required
          maxLength={150}
          defaultValue={values.name}
          {...invalid('name', 'client-name')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field
        id="client-type"
        label="Type de client"
        error={fieldErrors.isCompany}
      >
        <select
          id="client-type"
          name="isCompany"
          key={values.isCompany}
          defaultValue={values.isCompany}
          {...invalid('isCompany', 'client-type')}
          className={FIELD_CLASS}
        >
          <option value="false">Particulier</option>
          <option value="true">Entreprise</option>
        </select>
      </Field>

      <Field id="client-email" label="Adresse e-mail" error={fieldErrors.email}>
        <input
          id="client-email"
          name="email"
          type="email"
          autoComplete="off"
          defaultValue={values.email}
          {...invalid('email', 'client-email')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="client-phone" label="Téléphone" error={fieldErrors.phone}>
        <input
          id="client-phone"
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="off"
          defaultValue={values.phone}
          {...invalid('phone', 'client-phone')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="client-address" label="Adresse" error={fieldErrors.address}>
        <input
          id="client-address"
          name="address"
          maxLength={200}
          autoComplete="off"
          defaultValue={values.address}
          {...invalid('address', 'client-address')}
          className={FIELD_CLASS}
        />
      </Field>

      <Field id="client-notes" label="Notes" error={fieldErrors.notes}>
        <textarea
          id="client-notes"
          name="notes"
          rows={4}
          maxLength={1000}
          defaultValue={values.notes}
          {...invalid('notes', 'client-notes')}
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
