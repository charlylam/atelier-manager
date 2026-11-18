'use client';

import { Button } from '@/components/Button';

export default function AppError({
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">Le service est indisponible</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        L’application n’a pas pu joindre l’API. Réessayez dans un instant.
      </p>
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={() => retry()}
        className="mt-4"
      >
        Réessayer
      </Button>
    </main>
  );
}
