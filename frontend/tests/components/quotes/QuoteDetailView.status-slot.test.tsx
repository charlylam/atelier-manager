// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteDetailView } from '@/components/quotes/QuoteDetailView';
import type { Quote } from '@/lib/quotes';

const QUOTE: Quote = {
  id: 7,
  reference: 'DEV-2026-0003',
  title: 'Porte d’entrée',
  description: null,
  status: 'sent',
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
  ],
  totals: { totalExclTax: '100.00', totalVat: '20.00', totalInclTax: '120.00' },
};

describe('QuoteDetailView : emplacement du statut', () => {
  it('affiche le panneau de statut après la section des lignes', () => {
    render(
      <QuoteDetailView quote={QUOTE} statusPanel={<p>Panneau de statut</p>} />
    );

    const panel = screen.getByText('Panneau de statut');
    const lines = screen.getByRole('region', { name: 'Lignes' });

    expect(lines).not.toContainElement(panel);
    expect(
      lines.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('n’affiche rien de plus sans panneau de statut', () => {
    const { container } = render(<QuoteDetailView quote={QUOTE} />);

    expect(screen.queryByText('Panneau de statut')).not.toBeInTheDocument();
    // Dernier élément rendu : la section des lignes, sans conteneur vide après elle.
    expect(container.lastElementChild).toBe(
      screen.getByRole('region', { name: 'Lignes' })
    );
  });
});
