'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { messageForCode } from '@/lib/messages';

type Props = {
  redirectTo: string;
  sessionExpired?: boolean;
};

export function LoginForm({ redirectTo, sessionExpired = false }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });

      if (!response.ok) {
        const body: { error?: { code?: string } } | null = await response
          .json()
          .catch(() => null);
        setError(messageForCode(body?.error?.code));
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(messageForCode('API_UNREACHABLE'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {sessionExpired && (
        <p
          role="status"
          className="rounded-md bg-amber-100 p-3 text-sm text-amber-900"
        >
          Votre session a expiré. Reconnectez-vous pour continuer.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Adresse e-mail
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-neutral-300 px-3 py-2 text-base font-normal"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-neutral-300 px-3 py-2 text-base font-normal"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-100 p-3 text-sm text-red-900"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="text-center text-sm">
        Pas encore d’atelier ?{' '}
        <Link href="/inscription" className="underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
