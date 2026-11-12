// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { LoginForm } from '@/components/LoginForm';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function submit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText('Adresse e-mail'),
    'admin@atelier-martin.test'
  );
  await user.type(screen.getByLabelText('Mot de passe'), 'Demo2026!');
  await user.click(screen.getByRole('button', { name: 'Se connecter' }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

describe('LoginForm', () => {
  it('envoie les identifiants au Route Handler, puis va à la destination', async () => {
    fetchMock.mockResolvedValue(json({ data: { user: { id: 1 } } }));
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/clients" />);

    await submit(user);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/clients'));
    expect(router.refresh).toHaveBeenCalled();

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(JSON.parse(options.body)).toEqual({
      email: 'admin@atelier-martin.test',
      password: 'Demo2026!',
    });
  });

  it('affiche un message en français pour un mot de passe erroné', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
        },
        401
      )
    );
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/tableau-de-bord" />);

    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou mot de passe incorrect.'
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it('affiche un message distinct quand les tentatives sont limitées', async () => {
    fetchMock.mockResolvedValue(
      json(
        { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts' } },
        429
      )
    );
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/tableau-de-bord" />);

    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Trop de tentatives'
    );
  });

  it('affiche un message quand le service est injoignable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    render(<LoginForm redirectTo="/tableau-de-bord" />);

    await submit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'momentanément indisponible'
    );
  });

  it('prévient quand la session a expiré', () => {
    render(<LoginForm redirectTo="/tableau-de-bord" sessionExpired />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Votre session a expiré'
    );
  });
});
