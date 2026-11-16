// Formulaire sans état, sans JavaScript client : l'action serveur enregistre le nouvel ordre
// puis ramène à la fiche du chantier. Le symbole est décoratif : le nom accessible dit l'action.
export function MovePhaseForm({
  action,
  direction,
  name,
}: {
  action: () => Promise<void>;
  direction: 'up' | 'down';
  name: string;
}) {
  const label = direction === 'up' ? 'Monter' : 'Descendre';

  return (
    <form action={action}>
      <button
        type="submit"
        aria-label={`${label} la phase ${name}`}
        title={label}
        className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm"
      >
        <span aria-hidden="true">{direction === 'up' ? '↑' : '↓'}</span>
      </button>
    </form>
  );
}
