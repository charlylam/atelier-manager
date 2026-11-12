import type { ReactNode } from 'react';
import { getMe } from '@/lib/api';
import { orLogin } from '@/lib/session-guard';
import { LogoutButton } from './LogoutButton';
import { NavLinks } from './NavLinks';

const ROLE_LABELS = { admin: 'Administrateur', member: 'Membre' } as const;

// Cadre des pages connectées : vérifie la session auprès de l'API et affiche
// l'utilisateur et son atelier. Le filtre d'accès (proxy.ts) ne regarde que la
// présence du cookie : un jeton expiré ou falsifié est refusé ici, par l'API.
export async function AppShell({ children }: { children: ReactNode }) {
  const user = await orLogin(getMe());

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 px-6 py-3">
        <div className="flex items-center gap-6">
          <p className="font-semibold">{user.workshop.name}</p>
          <NavLinks />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <p>
            {user.firstName} {user.lastName}
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              ({ROLE_LABELS[user.role]})
            </span>
          </p>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </>
  );
}
