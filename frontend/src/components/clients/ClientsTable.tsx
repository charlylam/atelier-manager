import Link from 'next/link';
import type { Client } from '@/lib/clients';

export function ClientsTable({
  clients,
  search,
}: {
  clients: Client[];
  search?: string;
}) {
  if (clients.length === 0) {
    return (
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">
        {search
          ? `Aucun client ne correspond à « ${search} ».`
          : 'Aucun client.'}
      </p>
    );
  }

  return (
    <table className="mt-4 w-full text-left text-sm">
      <caption className="sr-only">
        Clients de l’atelier, par ordre alphabétique
      </caption>
      <thead>
        <tr className="border-b border-neutral-300 dark:border-neutral-700">
          <th scope="col" className="py-2 pr-3">
            Code
          </th>
          <th scope="col" className="py-2 pr-3">
            Nom
          </th>
          <th scope="col" className="py-2 pr-3">
            Type
          </th>
          <th scope="col" className="py-2 pr-3">
            E-mail
          </th>
          <th scope="col" className="py-2">
            Téléphone
          </th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr
            key={client.id}
            className="border-b border-neutral-200 dark:border-neutral-800"
          >
            <td className="py-2 pr-3 font-mono">{client.code}</td>
            <td className="py-2 pr-3">
              <Link
                href={`/clients/${client.id}`}
                className="font-medium underline"
              >
                {client.name}
              </Link>
            </td>
            <td className="py-2 pr-3">
              {client.isCompany ? 'Entreprise' : 'Particulier'}
            </td>
            <td className="py-2 pr-3">{client.email ?? '—'}</td>
            <td className="py-2">{client.phone ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
