import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ClientDetailView } from '@/components/clients/ClientDetailView';
import { getClient } from '@/lib/clients';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';

type Params = Promise<{ id: string }>;

export default function ClientPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du client…
        </p>
      }
    >
      <ClientContent params={params} />
    </Suspense>
  );
}

async function ClientContent({ params }: { params: Params }) {
  const id = parseId((await params).id);
  if (id === undefined) {
    notFound();
  }

  let client;
  try {
    client = await orLogin(getClient(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <ClientDetailView client={client} />;
}
