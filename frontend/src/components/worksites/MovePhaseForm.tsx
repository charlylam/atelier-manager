import { Button } from '@/components/Button';
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
      <Button
        type="submit"
        aria-label={`${label} la phase ${name}`}
        title={label}
        variant="secondary"
        size="xs"
      >
        <span aria-hidden="true">{direction === 'up' ? '↑' : '↓'}</span>
      </Button>
    </form>
  );
}
