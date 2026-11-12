import Link from 'next/link';

export default function ClientNotFound() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Client introuvable</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Ce client n’existe pas, ou n’appartient pas à votre atelier.
      </p>
      <p className="mt-4">
        <Link href="/clients" className="underline">
          Retour aux clients
        </Link>
      </p>
    </>
  );
}
