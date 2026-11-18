// @vitest-environment jsdom
// Caractérisation (refactor/button-1) : fige l'ensemble EXACT des classes des 7 occurrences
// migrées vers Button. Ce fichier se retire en bloc une fois la migration relue.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import Home from '@/app/page';
import RootError from '@/app/error';
import GroupError from '@/app/(app)/error';
import { LoginForm } from '@/components/LoginForm';
import { LogoutButton } from '@/components/LogoutButton';
import { RegisterForm } from '@/components/RegisterForm';

const PRIMARY_SUBMIT =
  'rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60';
const SECONDARY_SMALL =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm disabled:opacity-60';
const ERROR_RETRY = 'mt-4 rounded-md bg-emerald-800 px-4 py-2 text-white';
const HOME_PRIMARY = 'rounded-md bg-emerald-800 px-4 py-2 text-white';
const HOME_SECONDARY =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2';

describe('caractérisation : classes des 7 occurrences de bouton', () => {
  it('LoginForm : bouton « Se connecter »', () => {
    render(<LoginForm redirectTo="/clients" />);
    expect(screen.getByRole('button', { name: 'Se connecter' })).toHaveClass(
      PRIMARY_SUBMIT,
      { exact: true }
    );
  });

  it('RegisterForm : bouton « Créer mon atelier »', () => {
    render(<RegisterForm />);
    expect(
      screen.getByRole('button', { name: 'Créer mon atelier' })
    ).toHaveClass(PRIMARY_SUBMIT, { exact: true });
  });

  it('LogoutButton : bouton « Se déconnecter »', () => {
    render(<LogoutButton />);
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toHaveClass(
      SECONDARY_SMALL,
      { exact: true }
    );
  });

  it('app/error.tsx : bouton « Réessayer »', () => {
    render(<RootError error={new Error('x')} retry={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Réessayer' })).toHaveClass(
      ERROR_RETRY,
      { exact: true }
    );
  });

  it('app/(app)/error.tsx : bouton « Réessayer »', () => {
    render(<GroupError error={new Error('x')} retry={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Réessayer' })).toHaveClass(
      ERROR_RETRY,
      { exact: true }
    );
  });

  it('app/page.tsx : lien principal « Se connecter »', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveClass(
      HOME_PRIMARY,
      { exact: true }
    );
  });

  it('app/page.tsx : lien secondaire « Créer mon atelier »', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Créer mon atelier' })).toHaveClass(
      HOME_SECONDARY,
      { exact: true }
    );
  });
});
