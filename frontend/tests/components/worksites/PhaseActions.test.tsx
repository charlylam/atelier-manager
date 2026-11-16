// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhaseActions } from '@/components/worksites/PhaseActions';
import { PhaseHoursForm } from '@/components/worksites/PhaseHoursForm';
import { PhaseStatusForm } from '@/components/worksites/PhaseStatusForm';
import { HOURS_MESSAGE } from '@/lib/phase-progress';
import type { PhaseHoursState } from '@/lib/phase-progress';
import type { Phase } from '@/lib/worksites';

const PHASE: Phase = {
  id: 11,
  position: 2,
  name: 'Usinage',
  status: 'in_progress',
  estimatedHours: '12.50',
  actualHours: '3.00',
  notes: null,
  assignee: null,
};

function setup(overrides: Partial<Parameters<typeof PhaseActions>[0]> = {}) {
  const statusAction = vi.fn(() => vi.fn(async () => ({})));
  const moveAction = vi.fn(() => vi.fn(async () => undefined));
  render(
    <PhaseActions
      worksiteId={4}
      phase={PHASE}
      isFirst={false}
      isLast={false}
      structure
      progress
      statusAction={statusAction}
      hoursAction={vi.fn(async (state: PhaseHoursState) => state)}
      moveAction={moveAction}
      deleteAction={vi.fn(async () => undefined)}
      {...overrides}
    />
  );
  return { statusAction, moveAction };
}

describe('PhaseActions', () => {
  it('propose structure et avancement pendant la fabrication', () => {
    const { statusAction } = setup();

    expect(
      screen.getByRole('button', { name: 'Terminer la phase Usinage' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remettre à faire la phase Usinage' })
    ).toBeInTheDocument();
    expect(statusAction).toHaveBeenCalledWith('done');
    expect(statusAction).toHaveBeenCalledWith('todo');
    expect(
      screen.getByLabelText('Heures réelles de la phase Usinage')
    ).toHaveValue(3);
    expect(
      screen.getByRole('button', { name: 'Monter la phase Usinage' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Descendre la phase Usinage' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Modifier la phase Usinage' })
    ).toHaveAttribute('href', '/chantiers/4/phases/11/modifier');
    expect(
      screen.getByRole('button', { name: 'Supprimer la phase Usinage' })
    ).toBeInTheDocument();
  });

  it('ne propose que la structure avant la fabrication', () => {
    const { statusAction } = setup({ progress: false });

    expect(statusAction).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /Terminer la phase/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Heures réelles de la phase Usinage')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Modifier la phase Usinage' })
    ).toBeInTheDocument();
  });

  it('ne propose pas de monter la première phase', () => {
    const { moveAction } = setup({ isFirst: true });
    expect(
      screen.queryByRole('button', { name: 'Monter la phase Usinage' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Descendre la phase Usinage' })
    ).toBeInTheDocument();
    expect(moveAction).toHaveBeenCalledWith('down');
    expect(moveAction).not.toHaveBeenCalledWith('up');
  });

  it('ne propose pas de descendre la dernière phase', () => {
    setup({ isLast: true });

    expect(
      screen.getByRole('button', { name: 'Monter la phase Usinage' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Descendre la phase Usinage' })
    ).not.toBeInTheDocument();
  });

  it('n’affiche rien sans structure ni avancement', () => {
    const { statusAction } = setup({ structure: false, progress: false });

    expect(statusAction).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('propose « Rouvrir » pour une phase terminée', () => {
    setup({ phase: { ...PHASE, status: 'done' } });

    expect(
      screen.getByRole('button', { name: 'Rouvrir la phase Usinage' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Remettre à faire/ })
    ).not.toBeInTheDocument();
  });
});

describe('PhaseStatusForm', () => {
  it('envoie le changement en un clic', async () => {
    const action = vi.fn(async () => ({}));
    const user = userEvent.setup();
    render(<PhaseStatusForm action={action} label="Terminer" name="Usinage" />);

    await user.click(
      screen.getByRole('button', { name: 'Terminer la phase Usinage' })
    );

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('affiche le message renvoyé par l’action', async () => {
    const action = vi.fn(async () => ({
      message: 'Statut changé entre-temps',
    }));
    const user = userEvent.setup();
    render(<PhaseStatusForm action={action} label="Terminer" name="Usinage" />);

    await user.click(
      screen.getByRole('button', { name: 'Terminer la phase Usinage' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Statut changé entre-temps'
    );
  });
});

describe('PhaseHoursForm', () => {
  type Action = (
    state: PhaseHoursState,
    formData: FormData
  ) => Promise<PhaseHoursState>;

  it('préremplit les heures réelles et pose les contraintes du champ', () => {
    render(
      <PhaseHoursForm action={vi.fn()} initialValue="3.00" name="Usinage" />
    );

    const input = screen.getByLabelText('Heures réelles de la phase Usinage');
    expect(input).toHaveValue(3);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('step', '0.01');
  });

  it('envoie la saisie', async () => {
    const action = vi.fn<Action>(async (state) => state);
    const user = userEvent.setup();
    render(
      <PhaseHoursForm action={action} initialValue="3.00" name="Usinage" />
    );

    const input = screen.getByLabelText('Heures réelles de la phase Usinage');
    await user.clear(input);
    await user.type(input, '7.5');
    await user.click(
      screen.getByRole('button', {
        name: 'Enregistrer les heures réelles de la phase Usinage',
      })
    );

    expect(action.mock.calls[0][1].get('actualHours')).toBe('7.5');
  });

  it('affiche le refus et garde la saisie', async () => {
    const action = vi.fn<Action>(async () => ({
      message: HOURS_MESSAGE,
      value: '1.234',
    }));
    const user = userEvent.setup();
    render(
      <PhaseHoursForm action={action} initialValue="3.00" name="Usinage" />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Enregistrer les heures réelles de la phase Usinage',
      })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(HOURS_MESSAGE);
    expect(
      screen.getByLabelText('Heures réelles de la phase Usinage')
    ).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByLabelText('Heures réelles de la phase Usinage')
    ).toHaveValue(1.234);
  });
});
