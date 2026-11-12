import type { ReactNode } from 'react';

// Champ de formulaire : l'erreur est hors du <label>, donc le nom du champ reste « Prix unitaire »
// et le message est lu une seule fois, par aria-describedby (à poser sur le champ : id + "-error").
export function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
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

export const FIELD_CLASS =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-base font-normal';

/** Attributs d'un champ en erreur, pour le relier à son message. */
export function invalidProps(error: string | undefined, id: string) {
  return error
    ? { 'aria-invalid': true as const, 'aria-describedby': `${id}-error` }
    : {};
}
