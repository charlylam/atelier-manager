// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Link from 'next/link';
import { Button, buttonClasses } from '@/components/Button';

describe('Button : classes', () => {
  it('primary + md', () => {
    render(
      <Button type="button" variant="primary" size="md">
        Valider
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Valider' })).toHaveClass(
      'rounded-md bg-emerald-800 px-4 py-2 text-white',
      { exact: true }
    );
  });

  it('primary + md avec className : les classes de l’appel s’ajoutent au noyau', () => {
    render(
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="font-medium disabled:opacity-60"
      >
        Valider
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Valider' })).toHaveClass(
      'rounded-md bg-emerald-800 px-4 py-2 text-white font-medium disabled:opacity-60',
      { exact: true }
    );
  });

  it('secondary + md', () => {
    render(
      <Button type="button" variant="secondary" size="md">
        Annuler
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveClass(
      'rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2',
      { exact: true }
    );
  });

  it('secondary + sm', () => {
    render(
      <Button type="button" variant="secondary" size="sm">
        Annuler
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveClass(
      'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm',
      { exact: true }
    );
  });

  it('neutral + md avec className', () => {
    render(
      <Button
        type="submit"
        variant="neutral"
        size="md"
        className="self-start text-sm font-medium disabled:opacity-60"
      >
        Confirmer
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Confirmer' })).toHaveClass(
      'rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 self-start text-sm font-medium disabled:opacity-60',
      { exact: true }
    );
  });

  it('danger + md avec className', () => {
    render(
      <Button
        type="submit"
        variant="danger"
        size="md"
        className="self-start text-sm font-medium disabled:opacity-60"
      >
        Supprimer
      </Button>
    );

    expect(screen.getByRole('button', { name: 'Supprimer' })).toHaveClass(
      'rounded-md bg-red-800 text-white px-4 py-2 self-start text-sm font-medium disabled:opacity-60',
      { exact: true }
    );
  });
});

describe('buttonClasses', () => {
  it('donne à un <Link> de next/link les mêmes classes qu’un bouton', () => {
    render(
      <Link
        href="/connexion"
        className={buttonClasses({ variant: 'primary', size: 'md' })}
      >
        Se connecter
      </Link>
    );

    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveClass(
      'rounded-md bg-emerald-800 px-4 py-2 text-white',
      { exact: true }
    );
  });

  it('ne laisse pas de classe vide ni d’espace en trop sans className', () => {
    expect(buttonClasses({ variant: 'secondary', size: 'md' })).toBe(
      'rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2'
    );
  });
});

describe('Button : attributs', () => {
  it('transmet type, disabled et onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <Button type="submit" variant="primary" size="md" onClick={onClick}>
        Envoyer
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Envoyer' });
    expect(button).toHaveAttribute('type', 'submit');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button
        type="button"
        variant="primary"
        size="md"
        disabled
        onClick={onClick}
      >
        Envoyer
      </Button>
    );
    const disabled = screen.getByRole('button', { name: 'Envoyer' });
    expect(disabled).toHaveAttribute('type', 'button');
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
