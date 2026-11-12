// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QuoteDetailView } from '@/components/quotes/QuoteDetailView';
import { QuoteSearch } from '@/components/quotes/QuoteSearch';
import { QuoteStatusBadge } from '@/components/quotes/QuoteStatusBadge';
import { QuoteStatusFilter } from '@/components/quotes/QuoteStatusFilter';
import { QuotesTable } from '@/components/quotes/QuotesTable';
import type { Quote, QuoteSummary } from '@/lib/quotes';

const plain = (element: HTMLElement) =>
  (element.textContent ?? '').replace(/[\u202f\u00a0]/g, ' ');

const SUMMARY: QuoteSummary = {
  id: 7,
  reference: 'DEV-2026-0001',
  title: 'Bibliothèque sur mesure en chêne',
  status: 'accepted',
  validUntil: '2026-12-31',
  createdAt: '2026-11-09T10:00:00.000Z',
  client: { id: 3, code: 'CLI-0001', name: 'Famille Durand' },
  totalInclTax: '2910.00',
};

describe('QuoteStatusBadge', () => {
  it('écrit le libellé français de chaque statut', () => {
    const labels = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
    } as const;

    for (const [status, label] of Object.entries(labels)) {
      const { unmount } = render(
        <QuoteStatusBadge status={status as keyof typeof labels} />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});

describe('QuoteStatusFilter', () => {
  it('propose « Tous » et les cinq statuts, et marque le filtre actif', () => {
    render(<QuoteStatusFilter status="sent" />);

    expect(screen.getAllByRole('link')).toHaveLength(6);
    expect(screen.getByRole('link', { name: 'Envoyés' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('link', { name: 'Tous' })).not.toHaveAttribute(
      'aria-current'
    );
    expect(screen.getByRole('link', { name: 'Envoyés' })).toHaveAttribute(
      'href',
      '/devis?status=sent'
    );
    expect(screen.getByRole('link', { name: 'Tous' })).toHaveAttribute(
      'href',
      '/devis'
    );
  });

  it('marque « Tous » quand aucun statut n’est choisi', () => {
    render(<QuoteStatusFilter />);

    expect(screen.getByRole('link', { name: 'Tous' })).toHaveAttribute(
      'aria-current',
      'true'
    );
  });

  it('garde la recherche en cours dans chaque lien', () => {
    render(<QuoteStatusFilter status="draft" search="chêne" />);

    expect(screen.getByRole('link', { name: 'Tous' })).toHaveAttribute(
      'href',
      '/devis?search=ch%C3%AAne'
    );
    expect(screen.getByRole('link', { name: 'Acceptés' })).toHaveAttribute(
      'href',
      '/devis?search=ch%C3%AAne&status=accepted'
    );
  });
});

describe('QuoteSearch', () => {
  it('envoie la recherche en GET vers /devis, sans JavaScript', () => {
    render(<QuoteSearch />);

    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/devis');
    expect(form).toHaveAttribute('method', 'get');
    expect(screen.getByRole('searchbox')).toHaveAttribute('name', 'search');
    expect(form.querySelector('input[name="status"]')).toBeNull();
  });

  it('garde le statut dans un champ caché, et le conserve en effaçant la recherche', () => {
    render(<QuoteSearch search="chêne" status="sent" />);

    expect(screen.getByRole('searchbox')).toHaveValue('chêne');
    expect(
      screen.getByRole('search').querySelector('input[name="status"]')
    ).toHaveValue('sent');
    expect(
      screen.getByRole('link', { name: 'Effacer la recherche' })
    ).toHaveAttribute('href', '/devis?status=sent');
  });
});

describe('QuotesTable', () => {
  it('liste les devis avec leurs liens, leur statut et leur total TTC', () => {
    render(
      <QuotesTable
        quotes={[
          SUMMARY,
          {
            ...SUMMARY,
            id: 8,
            reference: 'DEV-2026-0002',
            status: 'draft',
            validUntil: null,
          },
        ]}
        filtered={false}
      />
    );

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(
      within(rows[1]).getByRole('link', { name: 'DEV-2026-0001' })
    ).toHaveAttribute('href', '/devis/7');
    expect(
      within(rows[1]).getByRole('link', { name: 'Famille Durand' })
    ).toHaveAttribute('href', '/clients/3');
    expect(rows[1]).toHaveTextContent('Accepté');
    expect(rows[1]).toHaveTextContent('31/12/2026');
    expect(plain(rows[1])).toContain('2 910,00 €');
    expect(rows[2]).toHaveTextContent('Brouillon');
    expect(within(rows[2]).getAllByRole('cell')[4]).toHaveTextContent('—');
  });

  it('explique qu’il n’y a aucun devis, avec ou sans filtre', () => {
    const { rerender } = render(<QuotesTable quotes={[]} filtered={false} />);
    expect(screen.getByText('Aucun devis.')).toBeInTheDocument();

    rerender(<QuotesTable quotes={[]} filtered />);
    expect(
      screen.getByText('Aucun devis ne correspond à ces critères.')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('QuoteDetailView', () => {
  const quote: Quote = {
    id: 7,
    reference: 'DEV-2026-0001',
    title: 'Bibliothèque sur mesure en chêne',
    description: 'Chêne massif, finition huilée.',
    status: 'accepted',
    validUntil: '2026-12-31',
    createdAt: '2026-11-09T10:00:00.000Z',
    updatedAt: '2026-11-09T10:00:00.000Z',
    client: { id: 3, code: 'CLI-0001', name: 'Famille Durand' },
    lines: [
      {
        id: 1,
        position: 1,
        type: 'material',
        label: 'Chêne massif',
        quantity: '6.00',
        unit: 'm²',
        unitPrice: '180.00',
        vatRate: '20.00',
        totalExclTax: '1080.00',
      },
      {
        id: 2,
        position: 2,
        type: 'labor',
        label: 'Fabrication',
        quantity: '1.50',
        unit: 'h',
        unitPrice: '45.00',
        vatRate: '20.00',
        totalExclTax: '67.50',
      },
    ],
    totals: {
      totalExclTax: '1147.50',
      totalVat: '229.50',
      totalInclTax: '1377.00',
    },
  };

  it('affiche l’en-tête, le client, la validité et la description', () => {
    render(<QuoteDetailView quote={quote} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'DEV-2026-0001 · Bibliothèque sur mesure en chêne'
    );
    expect(screen.getByText('Accepté')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Famille Durand' })
    ).toHaveAttribute('href', '/clients/3');
    expect(screen.getByText('31/12/2026')).toBeInTheDocument();
    expect(
      screen.getByText('Chêne massif, finition huilée.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Devis' })).toHaveAttribute(
      'href',
      '/devis'
    );
  });

  it('formate les lignes : quantité sans zéros inutiles, prix, TVA et total HT', () => {
    render(<QuoteDetailView quote={quote} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(plain(rows[1])).toContain('Chêne massif');
    expect(plain(rows[1])).toContain('Matériau');
    expect(plain(rows[1])).toContain('6 m²');
    expect(plain(rows[1])).toContain('180,00 €');
    expect(plain(rows[1])).toContain('20 %');
    expect(plain(rows[1])).toContain('1 080,00 €');
    expect(plain(rows[2])).toContain('1,5 h');
    expect(plain(rows[2])).toContain('Main-d’œuvre');
  });

  it('affiche les totaux calculés par l’API', () => {
    render(<QuoteDetailView quote={quote} />);

    // « Total HT » et « TVA » sont aussi des en-têtes du tableau des lignes : on cherche
    // dans le bloc des totaux, repéré par « Total TTC » qui n'apparaît qu'une fois.
    const totals = within(
      screen.getByText('Total TTC').closest('dl') as HTMLElement
    );
    expect(
      plain(totals.getByText('Total HT').nextElementSibling as HTMLElement)
    ).toBe('1 147,50 €');
    expect(
      plain(totals.getByText('TVA').nextElementSibling as HTMLElement)
    ).toBe('229,50 €');
    expect(
      plain(totals.getByText('Total TTC').nextElementSibling as HTMLElement)
    ).toBe('1 377,00 €');
  });

  it('indique l’absence de ligne, de description et de validité', () => {
    render(
      <QuoteDetailView
        quote={{
          ...quote,
          lines: [],
          description: null,
          validUntil: null,
          status: 'draft',
          totals: {
            totalExclTax: '0.00',
            totalVat: '0.00',
            totalInclTax: '0.00',
          },
        }}
      />
    );

    expect(screen.getByText('Aucune ligne.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('affiche les actions fournies', () => {
    render(
      <QuoteDetailView quote={quote} actions={<span>Action de test</span>} />
    );

    expect(screen.getByText('Action de test')).toBeInTheDocument();
  });
});
