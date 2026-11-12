import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';

// L'utilisateur est lu à chaque requête : le cadre est donc dans une frontière
// Suspense, le reste de la page pouvant être préparé à l'avance.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6">Chargement…</p>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
