'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { messageForCode } from '@/lib/messages';

const FIELD_CLASS =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-2 text-base font-normal';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopName: form.get('workshopName'),
          firstName: form.get('firstName'),
          lastName: form.get('lastName'),
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

      router.push('/tableau-de-bord');
      router.refresh();
    } catch {
      setError(messageForCode('API_UNREACHABLE'));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nom de l’atelier
        <input
          name="workshopName"
          required
          minLength={2}
          maxLength={100}
          className={FIELD_CLASS}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prénom
          <input
            name="firstName"
            required
            maxLength={80}
            autoComplete="given-name"
            className={FIELD_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Nom
          <input
            name="lastName"
            required
            maxLength={80}
            autoComplete="family-name"
            className={FIELD_CLASS}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Adresse e-mail
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={FIELD_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Mot de passe
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          pattern="(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,128}"
          title="8 caractères au moins, dont une majuscule et un caractère spécial"
          autoComplete="new-password"
          className={FIELD_CLASS}
        />
        <span className="text-xs font-normal text-neutral-600 dark:text-neutral-400">
          8 caractères au moins, dont une majuscule et un caractère spécial.
        </span>
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
        {pending ? 'Création…' : 'Créer mon atelier'}
      </button>

      <p className="text-center text-sm">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
