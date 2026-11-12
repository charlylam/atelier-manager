// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import { LogoutButton } from '@/components/LogoutButton';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

describe('LogoutButton', () => {
  it('supprime la session puis renvoie vers la connexion', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/connexion'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
    });
  });
});
