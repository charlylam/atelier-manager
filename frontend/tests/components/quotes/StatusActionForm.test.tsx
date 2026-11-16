// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusActionForm } from '@/components/quotes/StatusActionForm';
import { STATUS_CHANGES } from '@/lib/quote-status-ui';

const change = STATUS_CHANGES.sent;

describe('StatusActionForm', () => {
  it('affiche la question au premier clic et n’envoie qu’au second', async () => {
    const action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<StatusActionForm action={action} change={change} />);

    expect(screen.getByText(change.question)).not.toBeVisible();

    await user.click(screen.getByText('Marquer comme envoyé'));

    expect(screen.getByText(change.question)).toBeVisible();
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmer l’envoi' }));

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('affiche le message renvoyé par l’action', async () => {
    const action = vi.fn(async () => ({
      message:
        'Un devis sans ligne ne peut pas être envoyé. Ajoutez au moins une ligne.',
    }));
    const user = userEvent.setup();
    render(<StatusActionForm action={action} change={change} />);

    await user.click(screen.getByText('Marquer comme envoyé'));
    await user.click(screen.getByRole('button', { name: 'Confirmer l’envoi' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un devis sans ligne ne peut pas être envoyé.'
    );
  });

  it('n’affiche aucun message avant l’envoi', () => {
    render(
      <StatusActionForm action={vi.fn(async () => ({}))} change={change} />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
