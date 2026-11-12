'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Field, FIELD_CLASS, invalidProps } from '@/components/form/Field';
import { lineInitialState } from '@/lib/line-form';
import type { LineFormState, LineFormValues } from '@/lib/line-form';
import { QUOTE_LINE_TYPE_LABELS } from '@/lib/labels';

type Props = {
  action: (state: LineFormState, formData: FormData) => Promise<LineFormState>;
  initialValues: LineFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref?: string;
};

const TYPES = ['material', 'labor', 'service', 'other'] as const;

export function LineForm({
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    lineInitialState(initialValues)
  );
  const { values, fieldErrors } = state;

  // La clé du <select> le recrée quand l'action renvoie un autre type : React ne met pas à jour
  // une liste déroulante par `defaultValue` après un envoi, contrairement aux champs de texte.
  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-4">
      {state.message && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-3 text-sm text-red-900"
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="line-type" label="Type" error={fieldErrors.type}>
          <select
            id="line-type"
            name="type"
            key={values.type}
            defaultValue={values.type}
            {...invalidProps(fieldErrors.type, 'line-type')}
            className={FIELD_CLASS}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {QUOTE_LINE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="line-label" label="Désignation" error={fieldErrors.label}>
          <input
            id="line-label"
            name="label"
            required
            maxLength={200}
            defaultValue={values.label}
            {...invalidProps(fieldErrors.label, 'line-label')}
            className={FIELD_CLASS}
          />
        </Field>

        <Field id="line-quantity" label="Quantité" error={fieldErrors.quantity}>
          <input
            id="line-quantity"
            name="quantity"
            type="number"
            required
            min="0.01"
            step="0.01"
            inputMode="decimal"
            defaultValue={values.quantity}
            {...invalidProps(fieldErrors.quantity, 'line-quantity')}
            className={FIELD_CLASS}
          />
        </Field>

        <Field id="line-unit" label="Unité" error={fieldErrors.unit}>
          <input
            id="line-unit"
            name="unit"
            required
            maxLength={20}
            list="line-units"
            defaultValue={values.unit}
            {...invalidProps(fieldErrors.unit, 'line-unit')}
            className={FIELD_CLASS}
          />
          <datalist id="line-units">
            <option value="m²" />
            <option value="m" />
            <option value="h" />
            <option value="u" />
            <option value="forfait" />
          </datalist>
        </Field>

        <Field
          id="line-unit-price"
          label="Prix unitaire HT (€)"
          error={fieldErrors.unitPrice}
        >
          <input
            id="line-unit-price"
            name="unitPrice"
            type="number"
            required
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={values.unitPrice}
            {...invalidProps(fieldErrors.unitPrice, 'line-unit-price')}
            className={FIELD_CLASS}
          />
        </Field>

        <Field id="line-vat-rate" label="TVA (%)" error={fieldErrors.vatRate}>
          <input
            id="line-vat-rate"
            name="vatRate"
            type="number"
            required
            min="0"
            max="99.99"
            step="0.01"
            inputMode="decimal"
            defaultValue={values.vatRate}
            {...invalidProps(fieldErrors.vatRate, 'line-vat-rate')}
            className={FIELD_CLASS}
          />
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
        {cancelHref && (
          <Link href={cancelHref} className="text-sm underline">
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}
