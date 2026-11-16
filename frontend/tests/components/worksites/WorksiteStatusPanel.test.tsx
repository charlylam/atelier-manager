// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorksiteStatusPanel } from '@/components/worksites/WorksiteStatusPanel';
import type { WorksiteStatus } from '@/lib/labels';

function renderPanel(status: WorksiteStatus) {
  const action = vi.fn(async () => ({}));
  const statusAction = vi.fn(() => action);
  const view = render(
    <WorksiteStatusPanel worksite={{ status }} statusAction={statusAction} />
  );
  return { statusAction, action, ...view };
}

describe('WorksiteStatusPanel', () => {
  it.each([
    ['pending', ['Lancer la fabrication', 'Annuler le chantier']],
    ['in_production', ['Marquer comme prêt à livrer', 'Annuler le chantier']],
    ['ready', ['Marquer comme livré', 'Annuler le chantier']],
  ] as const)('propose les changements d’un chantier %s', (status, labels) => {
    const { statusAction } = renderPanel(status);

    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(statusAction).toHaveBeenCalledTimes(labels.length);
  });

  it('lie chaque bouton au statut visé', () => {
    const { statusAction } = renderPanel('in_production');

    expect(statusAction).toHaveBeenCalledWith('ready');
    expect(statusAction).toHaveBeenCalledWith('canceled');
  });

  it.each(['delivered', 'canceled'] as const)(
    'n’affiche rien pour un chantier %s',
    (status) => {
      const { container, statusAction } = renderPanel(status);

      expect(container).toBeEmptyDOMElement();
      expect(statusAction).not.toHaveBeenCalled();
    }
  );

  it('demande une confirmation avant d’envoyer', async () => {
    const { action } = renderPanel('ready');
    const user = userEvent.setup();

    await user.click(screen.getAllByText('Marquer comme livré')[0]);
    expect(action).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Confirmer la livraison' })
    );
    expect(action).toHaveBeenCalledTimes(1);
  });
});
