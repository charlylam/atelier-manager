// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteLineForm } from '@/components/quotes/DeleteLineForm';

describe('DeleteLineForm', () => {
  it('porte un nom accessible qui désigne la ligne', () => {
    render(
      <DeleteLineForm
        action={vi.fn(async () => undefined)}
        label="Chêne massif"
      />
    );

    expect(
      screen.getByRole('button', { name: 'Supprimer la ligne Chêne massif' })
    ).toBeInTheDocument();
  });

  it('appelle l’action de suppression à l’envoi', async () => {
    const action = vi.fn(async () => undefined);
    const user = userEvent.setup();
    render(<DeleteLineForm action={action} label="Chêne massif" />);

    await user.click(
      screen.getByRole('button', { name: 'Supprimer la ligne Chêne massif' })
    );

    expect(action).toHaveBeenCalledTimes(1);
  });
});
