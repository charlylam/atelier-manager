import Link from 'next/link';
import { buttonClasses } from '@/components/Button';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Atelier Manager</h1>
      <p className="text-neutral-700 dark:text-neutral-300">
        Clients, devis, chantiers et phases de fabrication : le suivi d’un
        atelier de fabrication sur mesure.
      </p>
      <div className="flex gap-3">
        <Link
          href="/connexion"
          className={buttonClasses({ variant: 'primary', size: 'md' })}
        >
          Se connecter
        </Link>
        <Link
          href="/inscription"
          className={buttonClasses({ variant: 'secondary', size: 'md' })}
        >
          Créer mon atelier
        </Link>
      </div>
    </main>
  );
}
