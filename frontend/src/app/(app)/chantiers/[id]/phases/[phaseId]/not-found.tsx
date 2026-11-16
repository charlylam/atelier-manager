import Link from 'next/link';

export default function PhaseNotFound() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Phase ou chantier introuvable</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Cette phase ou ce chantier n’existe pas, ou n’appartient pas à votre
        atelier.
      </p>
      <p className="mt-4">
        <Link href="/chantiers" className="underline">
          Retour aux chantiers
        </Link>
      </p>
    </>
  );
}
