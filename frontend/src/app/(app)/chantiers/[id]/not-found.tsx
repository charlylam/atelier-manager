import Link from 'next/link';

export default function WorksiteNotFound() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Chantier introuvable</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Ce chantier n’existe pas, ou n’appartient pas à votre atelier.
      </p>
      <p className="mt-4">
        <Link href="/chantiers" className="underline">
          Retour aux chantiers
        </Link>
      </p>
    </>
  );
}
