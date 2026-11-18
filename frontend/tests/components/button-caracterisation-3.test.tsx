// @vitest-environment jsdom
// Caractérisation (refactor/button-3) : fige l'ensemble EXACT des classes, le type et l'état
// désactivé des boutons chantiers et phases migrés vers Button. Ce fichier se retire en bloc.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateWorksiteForm } from '@/components/worksites/CreateWorksiteForm';
import { MovePhaseForm } from '@/components/worksites/MovePhaseForm';
import { PhaseForm } from '@/components/worksites/PhaseForm';
import { PhaseHoursForm } from '@/components/worksites/PhaseHoursForm';
import { PhaseStatusForm } from '@/components/worksites/PhaseStatusForm';
import { WorksiteForm } from '@/components/worksites/WorksiteForm';
import { WorksiteSearch } from '@/components/worksites/WorksiteSearch';
import { EMPTY_PHASE_VALUES } from '@/lib/phase-form';

const NEUTRAL =
  'self-start rounded-md bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 disabled:opacity-60';
const SECONDARY_XS =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1 text-sm';
const PRIMARY_SUBMIT =
  'rounded-md bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-60';
const SECONDARY_SM_DISABLED =
  'rounded-md border border-neutral-300 dark:border-neutral-700 px-3 py-1 text-sm disabled:opacity-60';
const PRIMARY_SEARCH =
  'rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white';

describe('caractérisation : boutons chantiers et phases', () => {
  it('1. CreateWorksiteForm : « Créer ou ouvrir le chantier »', () => {
    render(<CreateWorksiteForm action={vi.fn()} />);
    const button = screen.getByRole('button', {
      name: 'Créer ou ouvrir le chantier',
    });
    expect(button).toHaveClass(NEUTRAL, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('3. MovePhaseForm : flèche vers le haut', () => {
    render(<MovePhaseForm action={vi.fn()} direction="up" name="Usinage" />);
    const button = screen.getByRole('button', {
      name: 'Monter la phase Usinage',
    });
    expect(button).toHaveClass(SECONDARY_XS, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('title', 'Monter');
  });

  it('3. MovePhaseForm : flèche vers le bas', () => {
    render(<MovePhaseForm action={vi.fn()} direction="down" name="Usinage" />);
    const button = screen.getByRole('button', {
      name: 'Descendre la phase Usinage',
    });
    expect(button).toHaveClass(SECONDARY_XS, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('title', 'Descendre');
  });

  it('4. PhaseForm : bouton d’envoi', () => {
    render(
      <PhaseForm
        action={vi.fn()}
        initialValues={EMPTY_PHASE_VALUES}
        submitLabel="Ajouter la phase"
        pendingLabel="Ajout…"
      />
    );
    const button = screen.getByRole('button', { name: 'Ajouter la phase' });
    expect(button).toHaveClass(PRIMARY_SUBMIT, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('5. PhaseHoursForm : « Enregistrer » les heures', () => {
    render(
      <PhaseHoursForm action={vi.fn()} initialValue="3.5" name="Usinage" />
    );
    const button = screen.getByRole('button', {
      name: 'Enregistrer les heures réelles de la phase Usinage',
    });
    expect(button).toHaveClass(SECONDARY_SM_DISABLED, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('6. PhaseStatusForm : bouton de statut', () => {
    render(
      <PhaseStatusForm action={vi.fn()} label="Démarrer" name="Usinage" />
    );
    const button = screen.getByRole('button', {
      name: 'Démarrer la phase Usinage',
    });
    expect(button).toHaveClass(SECONDARY_SM_DISABLED, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('7. WorksiteForm : « Enregistrer »', () => {
    render(
      <WorksiteForm
        action={vi.fn()}
        initialValues={{
          title: 'Bibliothèque',
          description: '',
          siteAddress: '',
          dueDate: '',
        }}
        cancelHref="/chantiers/4"
      />
    );
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button).toHaveClass(PRIMARY_SUBMIT, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toBeEnabled();
  });

  it('8. WorksiteSearch : « Rechercher »', () => {
    render(<WorksiteSearch />);
    const button = screen.getByRole('button', { name: 'Rechercher' });
    expect(button).toHaveClass(PRIMARY_SEARCH, { exact: true });
    expect(button).toHaveAttribute('type', 'submit');
  });
});
