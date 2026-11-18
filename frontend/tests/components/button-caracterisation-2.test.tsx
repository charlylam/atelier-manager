// @vitest-environment jsdom
// Caractérisation (refactor/button-2) : fige l'ensemble EXACT des classes, le type et l'état
// désactivé des boutons migrés vers Button (clients et devis). Ce fichier se retire en bloc.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientForm } from '@/components/clients/ClientForm';
import { ClientSearch } from '@/components/clients/ClientSearch';
import { DeleteClientForm } from '@/components/clients/DeleteClientForm';
import { DuplicateForm } from '@/components/quotes/DuplicateForm';
import { LineForm } from '@/components/quotes/LineForm';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { QuoteSearch } from '@/components/quotes/QuoteSearch';
import { StatusActionForm } from '@/components/quotes/StatusActionForm';
import { EMPTY_VALUES } from '@/lib/client-form';
import { DEFAULT_LINE_VALUES } from '@/lib/line-form';
import { EMPTY_QUOTE_VALUES } from '@/lib/quote-form';

const PRIMARY_SUBMIT =
  'rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60';
const PRIMARY_SEARCH =
  'rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white';
const DANGER =
  'self-start rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60';
const SECONDARY =
  'self-start rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium disabled:opacity-60';
const NEUTRAL =
  'self-start rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 disabled:opacity-60';

describe('caractérisation : boutons clients et devis', () => {
  it('1. ClientForm : bouton d’envoi', () => {
    render(
      <ClientForm
        action={vi.fn()}
        initialValues={EMPTY_VALUES}
        submitLabel="Créer le client"
        pendingLabel="Création…"
        cancelHref="/clients"
      />
    );
    const button = screen.getByRole('button', { name: 'Créer le client' });
    expect(button).toHaveClass(PRIMARY_SUBMIT, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('2. ClientSearch : bouton « Rechercher »', () => {
    render(<ClientSearch />);
    const button = screen.getByRole('button', { name: 'Rechercher' });
    expect(button).toHaveClass(PRIMARY_SEARCH, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('3. DeleteClientForm : bouton « Confirmer la suppression »', () => {
    render(<DeleteClientForm action={vi.fn()} clientName="Famille Durand" />);
    const button = screen.getByRole('button', {
      name: 'Confirmer la suppression',
    });
    expect(button).toHaveClass(DANGER, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('5. DuplicateForm : bouton « Dupliquer ce devis »', () => {
    render(<DuplicateForm action={vi.fn()} />);
    const button = screen.getByRole('button', { name: 'Dupliquer ce devis' });
    expect(button).toHaveClass(SECONDARY, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('6. LineForm : bouton d’envoi', () => {
    render(
      <LineForm
        action={vi.fn()}
        initialValues={DEFAULT_LINE_VALUES}
        submitLabel="Ajouter la ligne"
        pendingLabel="Ajout…"
      />
    );
    const button = screen.getByRole('button', { name: 'Ajouter la ligne' });
    expect(button).toHaveClass(PRIMARY_SUBMIT, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('7. QuoteForm : bouton d’envoi', () => {
    render(
      <QuoteForm
        action={vi.fn()}
        initialValues={EMPTY_QUOTE_VALUES}
        clients={[]}
        submitLabel="Créer le brouillon"
        pendingLabel="Création…"
        cancelHref="/devis"
      />
    );
    const button = screen.getByRole('button', { name: 'Créer le brouillon' });
    expect(button).toHaveClass(PRIMARY_SUBMIT, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('8. QuoteSearch : bouton « Rechercher »', () => {
    render(<QuoteSearch />);
    const button = screen.getByRole('button', { name: 'Rechercher' });
    expect(button).toHaveClass(PRIMARY_SEARCH, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('9. StatusActionForm : bouton de confirmation', () => {
    render(
      <StatusActionForm
        action={vi.fn()}
        change={{
          label: 'Marquer comme envoyé',
          question: 'Marquer ce devis comme envoyé ?',
          confirmLabel: 'Confirmer l’envoi',
        }}
      />
    );
    const button = screen.getByRole('button', { name: 'Confirmer l’envoi' });
    expect(button).toHaveClass(NEUTRAL, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });
});
