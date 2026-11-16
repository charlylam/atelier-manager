// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteStatusPanel } from '@/components/quotes/QuoteStatusPanel';
import type { QuoteStatus } from '@/lib/labels';
import type { QuoteLine } from '@/lib/quotes';
import { NO_LINES_EXPLANATION } from '@/lib/quote-status-ui';

const LINE: QuoteLine = {
  id: 1,
  position: 1,
  type: 'labor',
  label: 'Pose',
  quantity: '1',
  unit: 'h',
  unitPrice: '50.00',
  vatRate: '20.00',
  totalExclTax: '50.00',
};

function renderPanel(status: QuoteStatus, lines: QuoteLine[] = [LINE]) {
  const statusAction = vi.fn(() => vi.fn(async () => ({})));
  render(
    <QuoteStatusPanel
      quote={{ status, lines }}
      statusAction={statusAction}
      duplicateAction={vi.fn(async () => ({}))}
      worksiteAction={vi.fn(async () => ({}))}
    />
  );
  return { statusAction };
}

const DUPLICATE = { name: 'Dupliquer ce devis' };
const WORKSITE = { name: 'Créer ou ouvrir le chantier' };

describe('QuoteStatusPanel', () => {
  it('propose l’envoi d’un brouillon qui a des lignes', () => {
    const { statusAction } = renderPanel('draft');

    expect(screen.getByText('Marquer comme envoyé')).toBeInTheDocument();
    expect(screen.queryByText(NO_LINES_EXPLANATION)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', DUPLICATE)).not.toBeInTheDocument();
    expect(statusAction).toHaveBeenCalledWith('sent');
  });

  it('explique pourquoi un brouillon sans ligne ne peut pas être envoyé', () => {
    const { statusAction } = renderPanel('draft', []);

    expect(screen.getByText(NO_LINES_EXPLANATION)).toBeInTheDocument();
    expect(screen.queryByText('Marquer comme envoyé')).not.toBeInTheDocument();
    expect(statusAction).not.toHaveBeenCalled();
  });

  it('propose l’acceptation et le refus d’un devis envoyé', () => {
    const { statusAction } = renderPanel('sent');

    expect(screen.getByText('Marquer comme accepté')).toBeInTheDocument();
    expect(screen.getByText('Marquer comme refusé')).toBeInTheDocument();
    expect(screen.queryByText('Marquer comme envoyé')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', DUPLICATE)).not.toBeInTheDocument();
    expect(statusAction).toHaveBeenCalledWith('accepted');
    expect(statusAction).toHaveBeenCalledWith('rejected');
  });

  it.each(['accepted', 'rejected', 'expired'] as const)(
    'propose seulement la duplication d’un devis %s',
    (status) => {
      const { statusAction } = renderPanel(status);

      expect(screen.getByRole('button', DUPLICATE)).toBeInTheDocument();
      expect(screen.queryByText(/^Marquer comme/)).not.toBeInTheDocument();
      expect(statusAction).not.toHaveBeenCalled();
    }
  );

  it('propose le chantier seulement pour un devis accepté', () => {
    renderPanel('accepted');

    expect(screen.getByRole('button', WORKSITE)).toBeInTheDocument();
    expect(screen.getByRole('button', DUPLICATE)).toBeInTheDocument();
  });

  it.each(['draft', 'sent', 'rejected', 'expired'] as const)(
    'ne propose pas de chantier pour un devis %s',
    (status) => {
      renderPanel(status);

      expect(screen.queryByRole('button', WORKSITE)).not.toBeInTheDocument();
    }
  );
});
