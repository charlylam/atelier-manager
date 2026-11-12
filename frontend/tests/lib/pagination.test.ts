import { describe, expect, it } from 'vitest';
import { pageHref } from '@/lib/pagination';

describe('pageHref', () => {
  it('n’ajoute aucun paramètre pour la page 1 sans recherche', () => {
    expect(pageHref('/clients', {}, 1)).toBe('/clients');
  });

  it('ajoute la page à partir de la page 2', () => {
    expect(pageHref('/clients', {}, 2)).toBe('/clients?page=2');
  });

  it('garde la recherche, et ignore les paramètres vides', () => {
    expect(pageHref('/clients', { search: 'durand' }, 3)).toBe(
      '/clients?search=durand&page=3'
    );
    expect(pageHref('/clients', { search: undefined }, 1)).toBe('/clients');
  });

  it('encode les caractères spéciaux de la recherche', () => {
    expect(pageHref('/clients', { search: 'Dupont & fils' }, 1)).toBe(
      '/clients?search=Dupont+%26+fils'
    );
  });
});
