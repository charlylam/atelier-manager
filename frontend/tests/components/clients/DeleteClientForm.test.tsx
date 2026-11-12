// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteClientForm } from '@/components/clients/DeleteClientForm';

describe('DeleteClientForm', () => {
  it('demande une confirmation avant de supprimer', async () => {
    const action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<DeleteClientForm action={action} clientName="Famille Durand" />);

    expect(screen.getByText('Famille Durand')).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByText('Supprimer ce client'));
    await user.click(
      screen.getByRole('button', { name: 'Confirmer la suppression' })
    );

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('affiche le refus renvoyé par l’action', async () => {
    const action = vi.fn(async () => ({
      message:
        'Ce client a des devis ou des chantiers : il ne peut pas être supprimé.',
    }));
    const user = userEvent.setup();
    render(<DeleteClientForm action={action} clientName="Famille Durand" />);

    await user.click(screen.getByText('Supprimer ce client'));
    await user.click(
      screen.getByRole('button', { name: 'Confirmer la suppression' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'il ne peut pas être supprimé'
    );
  });
});
