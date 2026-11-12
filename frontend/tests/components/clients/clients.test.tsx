// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ClientDetailView } from '@/components/clients/ClientDetailView';
import { ClientSearch } from '@/components/clients/ClientSearch';
import { ClientsTable } from '@/components/clients/ClientsTable';
import type { Client, ClientDetail } from '@/lib/clients';

const DURAND: Client = {
  id: 1,
  code: 'CLI-0001',
  name: 'Famille Durand',
  isCompany: false,
  email: 'durand@example.test',
  phone: '06 12 34 56 78',
  address: '12 rue des Lilas, 01100 Oyonnax',
  notes: 'Première ligne\nDeuxième ligne',
  createdAt: '2026-11-09T10:00:00.000Z',
};

const DUBOIS: Client = {
  ...DURAND,
  id: 2,
  code: 'CLI-0002',
  name: 'Menuiserie Dubois',
  isCompany: true,
  email: null,
  phone: null,
  address: null,
  notes: null,
};

describe('ClientSearch', () => {
  it('envoie la recherche en GET vers /clients, sans JavaScript', () => {
    render(<ClientSearch />);

    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/clients');
    expect(form).toHaveAttribute('method', 'get');
    expect(
      screen.getByRole('searchbox', {
        name: 'Rechercher un client par son nom',
      })
    ).toHaveAttribute('name', 'search');
    expect(
      screen.queryByRole('link', { name: 'Effacer la recherche' })
    ).not.toBeInTheDocument();
  });

  it('reprend la recherche en cours et propose de l’effacer', () => {
    render(<ClientSearch search="durand" />);

    expect(screen.getByRole('searchbox')).toHaveValue('durand');
    expect(
      screen.getByRole('link', { name: 'Effacer la recherche' })
    ).toHaveAttribute('href', '/clients');
  });
});

describe('ClientsTable', () => {
  it('liste les clients avec un lien vers leur fiche', () => {
    render(<ClientsTable clients={[DURAND, DUBOIS]} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(
      within(rows[1]).getByRole('link', { name: 'Famille Durand' })
    ).toHaveAttribute('href', '/clients/1');
    expect(rows[1]).toHaveTextContent('CLI-0001');
    expect(rows[1]).toHaveTextContent('Particulier');
    expect(rows[1]).toHaveTextContent('durand@example.test');
    expect(rows[2]).toHaveTextContent('Entreprise');
  });

  it('affiche un tiret pour un e-mail ou un téléphone absent', () => {
    render(<ClientsTable clients={[DUBOIS]} />);

    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');
    expect(cells[3]).toHaveTextContent('—');
    expect(cells[4]).toHaveTextContent('—');
  });

  it('explique qu’il n’y a aucun client, avec ou sans recherche', () => {
    const { rerender } = render(<ClientsTable clients={[]} />);
    expect(screen.getByText('Aucun client.')).toBeInTheDocument();

    rerender(<ClientsTable clients={[]} search="zzz" />);
    expect(
      screen.getByText('Aucun client ne correspond à « zzz ».')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('ClientDetailView', () => {
  const detail: ClientDetail = {
    ...DURAND,
    quotes: [
      {
        id: 10,
        reference: 'DEV-2026-0001',
        title: 'Bibliothèque en chêne',
        status: 'accepted',
        validUntil: '2026-12-31T00:00:00.000Z',
      },
      {
        id: 11,
        reference: 'DEV-2026-0003',
        title: 'Porte d’entrée',
        status: 'draft',
        validUntil: null,
      },
    ],
    worksites: [
      {
        id: 20,
        reference: 'CH-2026-0001',
        title: 'Bibliothèque en chêne',
        status: 'in_production',
        dueDate: '2026-12-15T00:00:00.000Z',
      },
    ],
  };

  it('affiche l’identité et les coordonnées', () => {
    render(<ClientDetailView client={detail} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Famille Durand' })
    ).toBeInTheDocument();
    expect(screen.getByText('CLI-0001')).toBeInTheDocument();
    expect(screen.getByText('Particulier')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'durand@example.test' })
    ).toHaveAttribute('href', 'mailto:durand@example.test');
    expect(
      screen.getByRole('link', { name: '06 12 34 56 78' })
    ).toHaveAttribute('href', 'tel:06 12 34 56 78');
    expect(
      screen.getByText('12 rue des Lilas, 01100 Oyonnax')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Clients' })).toHaveAttribute(
      'href',
      '/clients'
    );
  });

  it('liste les devis et les chantiers, avec libellés et dates à la française', () => {
    render(<ClientDetailView client={detail} />);

    const rows = screen.getAllByRole('row');

    const quoteRows = rows.filter((row) =>
      row.textContent?.includes('DEV-2026')
    );
    expect(quoteRows[0]).toHaveTextContent('Accepté');
    expect(quoteRows[0]).toHaveTextContent('31/12/2026');
    expect(quoteRows[1]).toHaveTextContent('Brouillon');
    expect(quoteRows[1]).toHaveTextContent('—');

    const worksiteRows = rows.filter((row) =>
      row.textContent?.includes('CH-2026')
    );
    expect(worksiteRows[0]).toHaveTextContent('En fabrication');
    expect(worksiteRows[0]).toHaveTextContent('15/12/2026');
  });

  it('indique l’absence de devis et de chantiers, et les coordonnées vides', () => {
    render(
      <ClientDetailView client={{ ...DUBOIS, quotes: [], worksites: [] }} />
    );

    expect(screen.getByText('Aucun devis.')).toBeInTheDocument();
    expect(screen.getByText('Aucun chantier.')).toBeInTheDocument();
    expect(screen.getByText('Entreprise')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBe(4);
  });
});
