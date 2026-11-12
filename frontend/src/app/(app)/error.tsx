'use client';

export default function AppError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">Le service est indisponible</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        L’application n’a pas pu joindre l’API. Réessayez dans un instant.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-emerald-800 px-4 py-2 text-white"
      >
        Réessayer
      </button>
    </main>
  );
}
