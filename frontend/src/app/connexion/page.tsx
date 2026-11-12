import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { getCurrentUserOrNull } from '@/lib/api';
import { safeRedirectPath } from '@/lib/redirect';

type SearchParams = Promise<{ redirect?: string; session?: string }>;

export default function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginContent({ searchParams }: { searchParams: SearchParams }) {
  const { redirect: target, session } = await searchParams;
  const destination = safeRedirectPath(target);

  // Déjà connecté avec un jeton valide : on va directement à la destination.
  // Un cookie périmé ne provoque pas de boucle : l'API le refuse et le formulaire s'affiche.
  const user = await getCurrentUserOrNull();
  if (user) {
    redirect(destination);
  }

  return (
    <LoginForm
      redirectTo={destination}
      sessionExpired={session === 'expiree'}
    />
  );
}
