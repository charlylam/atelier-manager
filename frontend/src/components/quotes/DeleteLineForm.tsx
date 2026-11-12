// Formulaire sans état, sans JavaScript client : l'action serveur supprime la ligne puis
// ramène à la fiche du devis.
export function DeleteLineForm({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        aria-label={`Supprimer la ligne ${label}`}
        className="text-sm text-red-800 dark:text-red-400 underline"
      >
        Supprimer
      </button>
    </form>
  );
}
