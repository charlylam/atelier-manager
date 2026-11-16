// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateWorksiteForm } from '@/components/worksites/CreateWorksiteForm';

const BUTTON = { name: 'Créer ou ouvrir le chantier' };

describe('CreateWorksiteForm', () => {
  it('envoie la demande en un seul clic', async () => {
    const action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<CreateWorksiteForm action={action} />);

    await user.click(screen.getByRole('button', BUTTON));

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('affiche le message renvoyé par l’action', async () => {
    const action = vi.fn(async () => ({
      message: 'Seul un devis accepté peut devenir un chantier.',
    }));
    const user = userEvent.setup();
    render(<CreateWorksiteForm action={action} />);

    await user.click(screen.getByRole('button', BUTTON));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Seul un devis accepté peut devenir un chantier.'
    );
  });

  it('n’affiche aucun message avant l’envoi', () => {
    render(<CreateWorksiteForm action={vi.fn(async () => ({}))} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
