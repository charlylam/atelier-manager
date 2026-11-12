// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from '@/components/Pagination';

describe('Pagination', () => {
  it('ne s’affiche pas quand il n’y a qu’une page', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} basePath="/clients" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('propose seulement « Suivant » sur la première page', () => {
    render(<Pagination page={1} totalPages={3} basePath="/clients" />);

    expect(screen.getByText('Page 1 sur 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Suivant' })).toHaveAttribute(
      'href',
      '/clients?page=2'
    );
    expect(
      screen.queryByRole('link', { name: 'Précédent' })
    ).not.toBeInTheDocument();
  });

  it('propose les deux liens au milieu, et garde la recherche', () => {
    render(
      <Pagination
        page={2}
        totalPages={3}
        basePath="/clients"
        params={{ search: 'durand' }}
      />
    );

    expect(screen.getByRole('link', { name: 'Précédent' })).toHaveAttribute(
      'href',
      '/clients?search=durand'
    );
    expect(screen.getByRole('link', { name: 'Suivant' })).toHaveAttribute(
      'href',
      '/clients?search=durand&page=3'
    );
  });

  it('propose seulement « Précédent » sur la dernière page', () => {
    render(<Pagination page={3} totalPages={3} basePath="/clients" />);

    expect(screen.getByRole('link', { name: 'Précédent' })).toHaveAttribute(
      'href',
      '/clients?page=2'
    );
    expect(
      screen.queryByRole('link', { name: 'Suivant' })
    ).not.toBeInTheDocument();
  });

  it('ramène à la dernière page quand l’URL en demande une trop loin', () => {
    render(<Pagination page={99} totalPages={3} basePath="/clients" />);

    expect(screen.getByRole('link', { name: 'Précédent' })).toHaveAttribute(
      'href',
      '/clients?page=3'
    );
  });
});
