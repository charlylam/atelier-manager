import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ClientForm } from '@/components/clients/ClientForm';
import { valuesFromClient } from '@/lib/client-form';
import { getClient } from '@/lib/clients';
import { ApiError } from '@/lib/errors';
import { parseId } from '@/lib/params';
import { orLogin } from '@/lib/session-guard';
import { updateClientAction } from '../../actions';

type Params = Promise<{ id: string }>;

export default function EditClientPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <p className="text-neutral-600 dark:text-neutral-400">
          Chargement du client…
        </p>
      }
    >
      <EditClientContent params={params} />
    </Suspense>
  );
}

async function EditClientContent({ params }: { params: Params }) {
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

  return (
    <>
      <h1 className="text-2xl font-semibold">Modifier {client.name}</h1>
      <div className="mt-6">
        <ClientForm
          action={updateClientAction.bind(null, client.id)}
          initialValues={valuesFromClient(client)}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref={`/clients/${client.id}`}
        />
      </div>
    </>
  );
}
