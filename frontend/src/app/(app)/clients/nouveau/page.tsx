import { ClientForm } from '@/components/clients/ClientForm';
import { EMPTY_VALUES } from '@/lib/client-form';
import { createClientAction } from '../actions';

export default function NewClientPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Nouveau client</h1>
      <div className="mt-6">
        <ClientForm
          action={createClientAction}
          initialValues={EMPTY_VALUES}
          submitLabel="Créer le client"
          pendingLabel="Création…"
          cancelHref="/clients"
        />
      </div>
    </>
  );
}
