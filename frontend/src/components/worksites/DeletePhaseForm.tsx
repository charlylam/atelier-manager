// Formulaire sans état, sans JavaScript client : l'action serveur supprime la phase puis
// ramène à la fiche du chantier.
export function DeletePhaseForm({
  action,
  name,
}: {
  action: () => Promise<void>;
  name: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label={`Supprimer la phase ${name}`}
        className="text-sm text-red-800 dark:text-red-400 underline"
      >
        Supprimer
      </button>
    </form>
  );
}
