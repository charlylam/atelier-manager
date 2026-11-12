// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QuoteDetailView } from '@/components/quotes/QuoteDetailView';
import type { Quote } from '@/lib/quotes';

const QUOTE: Quote = {
  id: 7,
  reference: 'DEV-2026-0003',
  title: 'Porte d’entrée',
  description: null,
  status: 'draft',
  validUntil: null,
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
  client: { id: 3, code: 'CLI-0001', name: 'Famille Durand' },
  lines: [
    {
      id: 1,
      position: 1,
      type: 'material',
      label: 'Chêne',
      quantity: '1.00',
      unit: 'u',
      unitPrice: '100.00',
      vatRate: '20.00',
      totalExclTax: '100.00',
    },
    {
      id: 2,
      position: 2,
      type: 'labor',
      label: 'Pose',
      quantity: '2.00',
      unit: 'h',
      unitPrice: '45.00',
      vatRate: '20.00',
      totalExclTax: '90.00',
    },
  ],
  totals: { totalExclTax: '190.00', totalVat: '38.00', totalInclTax: '228.00' },
};

describe('QuoteDetailView : emplacements d’édition', () => {
  it('ajoute une colonne d’actions, une cellule par ligne', () => {
    render(
      <QuoteDetailView
        quote={QUOTE}
        lineActions={(line) => <span>Action {line.label}</span>}
      />
    );

    const rows = screen.getAllByRole('row');
    expect(within(rows[0]).getAllByRole('columnheader')).toHaveLength(6);
    expect(within(rows[1]).getByText('Action Chêne')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Action Pose')).toBeInTheDocument();
  });

  it('garde cinq colonnes, sans colonne d’actions, quand le devis n’est pas modifiable', () => {
    render(<QuoteDetailView quote={{ ...QUOTE, status: 'sent' }} />);

    expect(
      within(screen.getAllByRole('row')[0]).getAllByRole('columnheader')
    ).toHaveLength(5);
  });

  it('affiche le pied de la section des lignes, même sans aucune ligne', () => {
    render(
      <QuoteDetailView
        quote={{ ...QUOTE, lines: [] }}
        linesFooter={<p>Formulaire d’ajout</p>}
      />
    );

    expect(screen.getByText('Aucune ligne.')).toBeInTheDocument();
    expect(screen.getByText('Formulaire d’ajout')).toBeInTheDocument();
  });

  it('affiche plusieurs actions à côté du titre', () => {
    render(
      <QuoteDetailView
        quote={QUOTE}
        actions={
          <>
            <span>Modifier</span>
            <span>PDF</span>
          </>
        }
      />
    );

    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });
});
