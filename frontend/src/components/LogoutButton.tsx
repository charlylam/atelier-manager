'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

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
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="disabled:opacity-60"
    >
      Se déconnecter
    </Button>
  );
}
