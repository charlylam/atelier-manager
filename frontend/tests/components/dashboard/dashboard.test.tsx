// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LateWorksites } from '@/components/dashboard/LateWorksites';
import { MonthNav } from '@/components/dashboard/MonthNav';
import { QuoteSummary } from '@/components/dashboard/QuoteSummary';
import { RevenueCard } from '@/components/dashboard/RevenueCard';
import { WorksiteStatusCards } from '@/components/dashboard/WorksiteStatusCards';
import type { Dashboard } from '@/lib/dashboard';

const plain = (element: HTMLElement) =>
  (element.textContent ?? '').replace(/[\u202f\u00a0]/g, ' ');

const LATE_ITEM: Dashboard['worksites']['late']['items'][number] = {
  id: 1,
  reference: 'CH-2026-0001',
  title: 'Bibliothèque sur mesure en chêne',
  status: 'in_production',
  dueDate: '2026-12-15',
  daysLate: 3,
  client: { id: 1, code: 'CLI-0001', name: 'Famille Durand' },
};

describe('WorksiteStatusCards', () => {
  it('affiche un compteur par statut, y compris à zéro', () => {
    render(
      <WorksiteStatusCards
        counts={{
          pending: 0,
          in_production: 2,
          ready: 0,
          delivered: 5,
          canceled: 1,
        }}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(within(items[0]).getByText('En attente')).toBeInTheDocument();
    expect(within(items[0]).getByText('0')).toBeInTheDocument();
    expect(within(items[1]).getByText('2')).toBeInTheDocument();
    expect(within(items[3]).getByText('Livrés')).toBeInTheDocument();
  });
});

describe('LateWorksites', () => {
  it('indique qu’aucun chantier n’est en retard', () => {
    render(<LateWorksites late={{ total: 0, items: [] }} />);

    expect(screen.getByText('Aucun chantier en retard.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('liste les chantiers avec leur échéance, leur retard et leur statut', () => {
    render(<LateWorksites late={{ total: 1, items: [LATE_ITEM] }} />);

    const row = screen.getAllByRole('row')[1];
    expect(row).toHaveTextContent('CH-2026-0001');
    expect(row).toHaveTextContent('Famille Durand');
    expect(row).toHaveTextContent('15/12/2026');
    expect(row).toHaveTextContent('3 jours');
    expect(row).toHaveTextContent('En fabrication');
  });

  it('écrit « 1 jour » au singulier et signale les chantiers non listés', () => {
    render(
      <LateWorksites
        late={{ total: 12, items: [{ ...LATE_ITEM, daysLate: 1 }] }}
      />
    );

    expect(screen.getByText('1 jour')).toBeInTheDocument();
    expect(screen.getByText('et 11 autres')).toBeInTheDocument();
  });
});

describe('QuoteSummary', () => {
  it('affiche les devis en attente avec leur total TTC, et les compteurs', () => {
    render(
      <QuoteSummary
        quotes={{
          byStatus: { draft: 1, sent: 1, accepted: 2, rejected: 1, expired: 1 },
          pending: { count: 1, totalInclTax: '2412.00' },
        }}
      />
    );

    const summary = screen
      .getByText(/devis en attente de réponse/)
      .closest('p')!;
    expect(plain(summary)).toBe(
      '1 devis en attente de réponse, pour 2 412,00 € TTC.'
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('Acceptés')).toBeInTheDocument();
  });
});

describe('RevenueCard', () => {
  it('affiche le chiffre d’affaires du mois, hors taxes, TVA et TTC', () => {
    render(
      <RevenueCard
        revenue={{
          month: '2026-09',
          deliveredWorksites: 1,
          totalExclTax: '1505.00',
          totalVat: '301.00',
          totalInclTax: '1806.00',
        }}
      />
    );

    expect(
      screen.getByText(/Chantiers livrés en septembre 2026/)
    ).toBeInTheDocument();
    expect(
      plain(screen.getByText('Hors taxes').nextElementSibling as HTMLElement)
    ).toBe('1 505,00 €');
    expect(
      plain(screen.getByText('TVA').nextElementSibling as HTMLElement)
    ).toBe('301,00 €');
    expect(
      plain(screen.getByText('TTC').nextElementSibling as HTMLElement)
    ).toBe('1 806,00 €');
  });
});

describe('MonthNav', () => {
  it('propose le mois précédent, le mois suivant et le mois en cours', () => {
    render(<MonthNav month="2026-09" />);

    expect(screen.getByText('septembre 2026')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Mois précédent' })
    ).toHaveAttribute('href', '/tableau-de-bord?month=2026-08');
    expect(screen.getByRole('link', { name: 'Mois suivant' })).toHaveAttribute(
      'href',
      '/tableau-de-bord?month=2026-10'
    );
    expect(screen.getByRole('link', { name: 'Mois en cours' })).toHaveAttribute(
      'href',
      '/tableau-de-bord'
    );
  });

  it('passe à l’année suivante en décembre', () => {
    render(<MonthNav month="2026-12" />);

    expect(screen.getByRole('link', { name: 'Mois suivant' })).toHaveAttribute(
      'href',
      '/tableau-de-bord?month=2027-01'
    );
  });
});
