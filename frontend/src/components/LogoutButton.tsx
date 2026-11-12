'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);

    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setPending(false);
    }

    router.push('/connexion');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm disabled:opacity-60"
    >
      Se déconnecter
    </button>
  );
}
