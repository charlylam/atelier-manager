import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/RegisterForm';
import { getCurrentUserOrNull } from '@/lib/api';

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Créer mon atelier</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <RegisterContent />
      </Suspense>
    </main>
  );
}

async function RegisterContent() {
  const user = await getCurrentUserOrNull();
  if (user) {
    redirect('/tableau-de-bord');
  }

  return <RegisterForm />;
}
