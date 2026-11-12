import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from '@/proxy';

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

describe('proxy (filtre d’accès)', () => {
  it('laisse passer une requête qui porte le cookie de session', () => {
    const response = proxy(request('/tableau-de-bord', 'token=jeton-123'));

    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });

  it('renvoie vers la connexion, en gardant la page demandée', () => {
    const response = proxy(request('/clients?search=durand'));

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location') ?? '');
    expect(location.pathname).toBe('/connexion');
    expect(location.searchParams.get('redirect')).toBe(
      '/clients?search=durand'
    );
  });

  it('s’applique aux pages connectées, pas aux pages publiques', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        '/tableau-de-bord/:path*',
        '/clients/:path*',
        '/devis/:path*',
        '/chantiers/:path*',
      ])
    );
    expect(config.matcher.join(' ')).not.toContain('connexion');
    expect(config.matcher.join(' ')).not.toContain('inscription');
  });
});
