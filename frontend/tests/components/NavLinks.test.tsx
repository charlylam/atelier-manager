// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const navigation = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock('next/navigation', () => navigation);

import { NavLinks } from '@/components/NavLinks';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('NavLinks', () => {
  it('marque la page courante', () => {
    navigation.usePathname.mockReturnValue('/tableau-de-bord');
    render(<NavLinks />);

    expect(
      screen.getByRole('link', { name: 'Tableau de bord' })
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Clients' })).not.toHaveAttribute(
      'aria-current'
    );
    expect(screen.getByRole('link', { name: 'Devis' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('garde « Clients » actif sur la fiche d’un client', () => {
    navigation.usePathname.mockReturnValue('/clients/12');
    render(<NavLinks />);

    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  it('garde « Devis » actif sur la fiche d’un devis', () => {
    navigation.usePathname.mockReturnValue('/devis/7');
    render(<NavLinks />);

    expect(screen.getByRole('link', { name: 'Devis' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Clients' })).not.toHaveAttribute(
      'aria-current'
    );
  });
});
