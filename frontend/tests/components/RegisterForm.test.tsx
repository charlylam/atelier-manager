// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { RegisterForm } from '@/components/RegisterForm';

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nom de l’atelier'), 'Atelier Martin');
  await user.type(screen.getByLabelText('Prénom'), 'Pierre');
  await user.type(screen.getByLabelText('Nom'), 'Martin');
  await user.type(
    screen.getByLabelText('Adresse e-mail'),
    'pierre@atelier-martin.test'
  );
  await user.type(screen.getByLabelText(/Mot de passe/), 'Demo2026!');
  await user.click(screen.getByRole('button', { name: 'Créer mon atelier' }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

describe('RegisterForm', () => {
  it('crée le compte puis ouvre le tableau de bord', async () => {
    fetchMock.mockResolvedValue(json({ data: { user: { id: 1 } } }, 201));
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillAndSubmit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/tableau-de-bord')
    );
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/register');
    expect(JSON.parse(options.body)).toEqual({
      workshopName: 'Atelier Martin',
      firstName: 'Pierre',
      lastName: 'Martin',
      email: 'pierre@atelier-martin.test',
      password: 'Demo2026!',
    });
  });

  it('affiche un message quand l’e-mail ou l’atelier existe déjà', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Email or workshop name already in use',
          },
        },
        409
      )
    );
    const user = userEvent.setup();
    render(<RegisterForm />);

    await fillAndSubmit(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('déjà utilisé');
    expect(router.push).not.toHaveBeenCalled();
  });

  it('exige tous les champs et un mot de passe conforme à la politique de l’API', () => {
    render(<RegisterForm />);

    for (const label of [
      'Nom de l’atelier',
      'Prénom',
      'Nom',
      'Adresse e-mail',
    ]) {
      expect(screen.getByLabelText(label)).toBeRequired();
    }
    const password = screen.getByLabelText(/Mot de passe/);
    expect(password).toBeRequired();
    expect(password).toHaveAttribute('minlength', '8');
    expect(password).toHaveAttribute('pattern');
  });
});
