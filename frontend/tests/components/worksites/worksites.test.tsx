// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { WorksiteSearch } from '@/components/worksites/WorksiteSearch';
import { WorksiteStatusBadge } from '@/components/worksites/WorksiteStatusBadge';
import { WorksiteStatusFilter } from '@/components/worksites/WorksiteStatusFilter';
import { WorksitesTable } from '@/components/worksites/WorksitesTable';
import type { WorksiteSummary } from '@/lib/worksites';

const SUMMARY: WorksiteSummary = {
  id: 4,
  reference: 'CH-2026-0001',
  title: 'Bibliothèque sur mesure en chêne',
  status: 'in_production',
  dueDate: '2026-12-15',
  createdAt: '2026-11-10T10:00:00.000Z',
  client: { id: 3, code: 'CLI-0001', name: 'Famille Durand' },
  progress: { done: 2, total: 5 },
};

describe('WorksiteStatusBadge', () => {
  it('écrit le libellé français de chaque statut', () => {
    const labels = {
      pending: 'En attente',
      in_production: 'En fabrication',
      ready: 'Prêt à livrer',
      delivered: 'Livré',
      canceled: 'Annulé',
    } as const;

    for (const [status, label] of Object.entries(labels)) {
      const { unmount } = render(
        <WorksiteStatusBadge status={status as keyof typeof labels} />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});

describe('WorksiteStatusFilter', () => {
  it('propose « Tous » et les cinq statuts, et marque le filtre actif', () => {
    render(<WorksiteStatusFilter status="ready" />);

    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(
      screen.getByRole('link', { name: 'Prêts à livrer' })
    ).toHaveAttribute('aria-current', 'true');
    expect(
      screen.getByRole('link', { name: 'Prêts à livrer' })
    ).toHaveAttribute('href', '/chantiers?status=ready');
    expect(screen.getByRole('link', { name: 'Tous' })).not.toHaveAttribute(
      'aria-current'
    );
    expect(screen.getByRole('link', { name: 'Tous' })).toHaveAttribute(
      'href',
      '/chantiers'
    );
  });

  it('marque « Tous » quand aucun statut n’est choisi', () => {
    render(<WorksiteStatusFilter />);

    expect(screen.getByRole('link', { name: 'Tous' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('garde la recherche en cours dans chaque lien', () => {
    render(<WorksiteStatusFilter status="pending" search="chêne" />);

    expect(screen.getByRole('link', { name: 'Tous' })).toHaveAttribute(
      'href',
      '/chantiers?search=ch%C3%AAne'
    );
    expect(screen.getByRole('link', { name: 'Livrés' })).toHaveAttribute(
      'href',
      '/chantiers?search=ch%C3%AAne&status=delivered'
    );
  });
});

describe('WorksiteSearch', () => {
  it('envoie la recherche en GET vers /chantiers, sans JavaScript', () => {
    render(<WorksiteSearch />);

    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/chantiers');
    expect(form).toHaveAttribute('method', 'get');
    expect(screen.getByRole('searchbox')).toHaveAttribute('name', 'search');
    expect(form.querySelector('input[name="status"]')).toBeNull();
  });

  it('garde le statut dans un champ caché, et le conserve en effaçant la recherche', () => {
    render(<WorksiteSearch search="chêne" status="ready" />);

    expect(screen.getByRole('searchbox')).toHaveValue('chêne');
    expect(
      screen.getByRole('search').querySelector('input[name="status"]')
    ).toHaveValue('ready');
    expect(
      screen.getByRole('link', { name: 'Effacer la recherche' })
    ).toHaveAttribute('href', '/chantiers?status=ready');
  });
});

describe('WorksitesTable', () => {
  it('liste les chantiers avec leurs liens, leur statut, leur échéance et leur avancement', () => {
    render(
      <WorksitesTable
        worksites={[
          SUMMARY,
          {
            ...SUMMARY,
            id: 5,
            reference: 'CH-2026-0002',
            status: 'pending',
            dueDate: null,
            progress: { done: 0, total: 5 },
          },
        ]}
        filtered={false}
      />
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(
      within(rows[1]).getByRole('link', { name: 'CH-2026-0001' })
    ).toHaveAttribute('href', '/chantiers/4');
    expect(
      within(rows[1]).getByRole('link', { name: 'Famille Durand' })
    ).toHaveAttribute('href', '/clients/3');
    expect(rows[1]).toHaveTextContent('En fabrication');
    expect(rows[1]).toHaveTextContent('15/12/2026');
    expect(rows[1]).toHaveTextContent('2 sur 5');
    expect(rows[2]).toHaveTextContent('En attente');
    expect(within(rows[2]).getAllByRole('cell')[4]).toHaveTextContent('—');
    expect(rows[2]).toHaveTextContent('0 sur 5');
  });

  it('explique qu’il n’y a aucun chantier, avec ou sans filtre', () => {
    const { rerender } = render(
      <WorksitesTable worksites={[]} filtered={false} />
    );
    expect(screen.getByText('Aucun chantier.')).toBeInTheDocument();

    rerender(<WorksitesTable worksites={[]} filtered />);
    expect(
      screen.getByText('Aucun chantier ne correspond à ces critères.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
