// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientDetailView } from '@/components/clients/ClientDetailView';
import type { ClientDetail } from '@/lib/clients';

const CLIENT: ClientDetail = {
  id: 1,
  code: 'CLI-0001',
  name: 'Famille Durand',
  isCompany: false,
  email: null,
  phone: null,
  address: null,
  notes: null,
  createdAt: '2026-11-09T10:00:00.000Z',
  quotes: [],
  worksites: [],
};

describe('ClientDetailView : emplacements', () => {
  it('affiche les actions et le pied de page quand on les fournit', () => {
    render(
      <ClientDetailView
        client={CLIENT}
        actions={<a href="/modifier">Modifier</a>}
        footer={<p>Zone de suppression</p>}
      />
    );

    expect(screen.getByRole('link', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.getByText('Zone de suppression')).toBeInTheDocument();
  });

  it('n’affiche rien de plus sans actions ni pied de page', () => {
    render(<ClientDetailView client={CLIENT} />);

    expect(
      screen.queryByRole('link', { name: 'Modifier' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Zone de suppression')).not.toBeInTheDocument();
  });
});
