import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';
import { ApiError } from '@/lib/errors';
import { LogoutButton } from './LogoutButton';

const ROLE_LABELS = { admin: 'Administrateur', member: 'Membre' } as const;

// Cadre des pages connectées : vérifie la session auprès de l'API et affiche
// l'utilisateur et son atelier. Le filtre d'accès (proxy.ts) ne regarde que la
// présence du cookie : un jeton expiré ou falsifié est refusé ici, par l'API.
export async function AppShell({ children }: { children: ReactNode }) {
  let user;

  try {
    user = await getMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/connexion?session=expiree');
    }
    throw error;
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-3">
        <p className="font-semibold">{user.workshop.name}</p>
        <div className="flex items-center gap-4 text-sm">
          <p>
            {user.firstName} {user.lastName}
            <span className="ml-2 text-neutral-600">
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
