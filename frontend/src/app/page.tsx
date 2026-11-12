import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Atelier Manager</h1>
      <p className="text-neutral-700">
        Clients, devis, chantiers et phases de fabrication : le suivi d’un
        atelier de fabrication sur mesure.
      </p>
      <div className="flex gap-3">
        <Link
          href="/connexion"
          className="rounded-md bg-emerald-800 px-4 py-2 text-white"
        >
          Se connecter
        </Link>
        <Link
          href="/inscription"
          className="rounded-md border border-neutral-300 px-4 py-2"
        >
          Créer mon atelier
        </Link>
      </div>
    </main>
  );
}
