import Link from 'next/link';

export default function QuoteNotFound() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Devis introuvable</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Ce devis n’existe pas, ou n’appartient pas à votre atelier.
      </p>
      <p className="mt-4">
        <Link href="/devis" className="underline">
          Retour aux devis
        </Link>
      </p>
    </>
  );
}
