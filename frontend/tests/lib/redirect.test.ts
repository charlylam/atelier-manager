import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '@/lib/redirect';

describe('safeRedirectPath', () => {
  it('accepte un chemin interne, avec ses paramètres', () => {
    expect(safeRedirectPath('/clients?search=durand')).toBe(
      '/clients?search=durand'
    );
  });

  it('revient à la destination par défaut quand le paramètre est absent', () => {
    expect(safeRedirectPath(undefined)).toBe('/tableau-de-bord');
    expect(safeRedirectPath('')).toBe('/tableau-de-bord');
  });

  it('refuse toute destination extérieure au site (redirection ouverte)', () => {
    for (const value of [
      'https://autre-site.com',
      '//autre-site.com',
      '/\\autre-site.com',
      'javascript:alert(1)',
      'clients',
    ]) {
      expect(safeRedirectPath(value), value).toBe('/tableau-de-bord');
    }
  });
});
