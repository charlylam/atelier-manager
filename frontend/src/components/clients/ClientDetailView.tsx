import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { QUOTE_STATUS_LABELS, WORKSITE_STATUS_LABELS } from '@/lib/labels';
import type { ClientDetail } from '@/lib/clients';

const EMPTY = '—';

export function ClientDetailView({ client }: { client: ClientDetail }) {
  return (
    <>
      <p className="text-sm">
        <Link href="/clients" className="underline">
          ← Clients
        </Link>
      </p>

      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-semibold">{client.name}</h1>
        <span className="font-mono text-neutral-600 dark:text-neutral-400">
          {client.code}
        </span>
        <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-sm">
          {client.isCompany ? 'Entreprise' : 'Particulier'}
        </span>
      </div>

      <section aria-labelledby="contact-heading" className="mt-6">
        <h2 id="contact-heading" className="text-lg font-semibold">
          Coordonnées
        </h2>
        <dl className="mt-3 grid max-w-xl grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <dt className="text-neutral-600 dark:text-neutral-400">E-mail</dt>
          <dd>
            {client.email ? (
              <a href={`mailto:${client.email}`} className="underline">
                {client.email}
              </a>
            ) : (
              EMPTY
            )}
          </dd>
          <dt className="text-neutral-600 dark:text-neutral-400">Téléphone</dt>
          <dd>
            {client.phone ? (
              <a href={`tel:${client.phone}`} className="underline">
                {client.phone}
              </a>
            ) : (
              EMPTY
            )}
          </dd>
          <dt className="text-neutral-600 dark:text-neutral-400">Adresse</dt>
          <dd>{client.address ?? EMPTY}</dd>
          <dt className="text-neutral-600 dark:text-neutral-400">Notes</dt>
          <dd className="whitespace-pre-line">{client.notes ?? EMPTY}</dd>
        </dl>
      </section>

      <section aria-labelledby="quotes-heading" className="mt-8">
        <h2 id="quotes-heading" className="text-lg font-semibold">
          Devis
        </h2>
        {client.quotes.length === 0 ? (
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Aucun devis.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Devis du client</caption>
            <thead>
              <tr className="border-b border-neutral-300 dark:border-neutral-700">
                <th scope="col" className="py-2 pr-3">
                  Référence
                </th>
                <th scope="col" className="py-2 pr-3">
                  Titre
                </th>
                <th scope="col" className="py-2 pr-3">
                  Statut
                </th>
                <th scope="col" className="py-2">
                  Valable jusqu’au
                </th>
              </tr>
            </thead>
            <tbody>
              {client.quotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="border-b border-neutral-200 dark:border-neutral-800"
                >
                  <td className="py-2 pr-3 font-mono">{quote.reference}</td>
                  <td className="py-2 pr-3">{quote.title}</td>
                  <td className="py-2 pr-3">
                    {QUOTE_STATUS_LABELS[quote.status]}
                  </td>
                  <td className="py-2">
                    {quote.validUntil ? formatDate(quote.validUntil) : EMPTY}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="worksites-heading" className="mt-8">
        <h2 id="worksites-heading" className="text-lg font-semibold">
          Chantiers
        </h2>
        {client.worksites.length === 0 ? (
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            Aucun chantier.
          </p>
        ) : (
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Chantiers du client</caption>
            <thead>
              <tr className="border-b border-neutral-300 dark:border-neutral-700">
                <th scope="col" className="py-2 pr-3">
                  Référence
                </th>
                <th scope="col" className="py-2 pr-3">
                  Titre
                </th>
                <th scope="col" className="py-2 pr-3">
                  Statut
                </th>
                <th scope="col" className="py-2">
                  Échéance
                </th>
              </tr>
            </thead>
            <tbody>
              {client.worksites.map((worksite) => (
                <tr
                  key={worksite.id}
                  className="border-b border-neutral-200 dark:border-neutral-800"
                >
                  <td className="py-2 pr-3 font-mono">{worksite.reference}</td>
                  <td className="py-2 pr-3">{worksite.title}</td>
                  <td className="py-2 pr-3">
                    {WORKSITE_STATUS_LABELS[worksite.status]}
                  </td>
                  <td className="py-2">
                    {worksite.dueDate ? formatDate(worksite.dueDate) : EMPTY}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
