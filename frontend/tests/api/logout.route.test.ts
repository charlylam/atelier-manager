import { describe, expect, it, vi } from 'vitest';

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  it('supprime le cookie de session', async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(cookieStore.delete).toHaveBeenCalledWith('token');
  });
});
