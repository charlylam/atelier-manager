// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DuplicateForm } from '@/components/quotes/DuplicateForm';

describe('DuplicateForm', () => {
  it('duplique en un seul clic', async () => {
    const action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<DuplicateForm action={action} />);

    await user.click(
      screen.getByRole('button', { name: 'Dupliquer ce devis' })
    );

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('affiche le message renvoyé par l’action', async () => {
    const action = vi.fn(async () => ({
      message: 'Impossible d’attribuer une référence à la copie. Réessayez.',
    }));
    const user = userEvent.setup();
    render(<DuplicateForm action={action} />);

    await user.click(
      screen.getByRole('button', { name: 'Dupliquer ce devis' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Impossible d’attribuer une référence à la copie.'
    );
  });

  it('n’affiche aucun message avant l’envoi', () => {
    render(<DuplicateForm action={vi.fn(async () => ({}))} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
