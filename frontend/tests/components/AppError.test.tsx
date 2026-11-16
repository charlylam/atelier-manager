// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RootError from '@/app/error';
import GroupError from '@/app/(app)/error';

const ERROR = new Error('API injoignable');

describe('src/app/error.tsx', () => {
  it('affiche le message d’indisponibilité en français', () => {
    render(<RootError error={ERROR} retry={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'Le service est indisponible' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'L’application n’a pas pu joindre l’API. Réessayez dans un instant.'
      )
    ).toBeInTheDocument();
  });

  it('appelle retry une fois au clic sur « Réessayer »', async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    render(<RootError error={ERROR} retry={retry} />);

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledTimes(1);
    // Sans argument : le clic ne transmet pas son événement à retry.
    expect(retry).toHaveBeenCalledWith();
  });

  // Les deux limites d'erreur sont des copies : ce test signale si l'une change sans l'autre.
  it('affiche le même contenu que (app)/error.tsx', () => {
    const { container: root } = render(
      <RootError error={ERROR} retry={vi.fn()} />
    );
    const { container: group } = render(
      <GroupError error={ERROR} retry={vi.fn()} />
    );

    expect(root.innerHTML).toBe(group.innerHTML);
  });
});
