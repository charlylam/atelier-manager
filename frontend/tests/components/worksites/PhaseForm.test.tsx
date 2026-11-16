// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeletePhaseForm } from '@/components/worksites/DeletePhaseForm';
import { PhaseForm } from '@/components/worksites/PhaseForm';
import { EMPTY_PHASE_VALUES, PHASE_FIELD_MESSAGES } from '@/lib/phase-form';
import type { PhaseFormState } from '@/lib/phase-form';

type Action = (
  state: PhaseFormState,
  formData: FormData
) => Promise<PhaseFormState>;

function renderForm(action: Action) {
  return render(
    <PhaseForm
      action={action}
      initialValues={EMPTY_PHASE_VALUES}
      submitLabel="Ajouter la phase"
      pendingLabel="Ajout…"
    />
  );
}

describe('PhaseForm', () => {
  it('pose les contraintes des champs', () => {
    renderForm(vi.fn());

    expect(screen.getByLabelText('Nom')).toBeRequired();
    expect(screen.getByLabelText('Nom')).toHaveAttribute('maxlength', '100');
    expect(screen.getByLabelText('Heures estimées')).toHaveAttribute(
      'type',
      'number'
    );
    expect(screen.getByLabelText('Heures estimées')).not.toBeRequired();
    expect(screen.getByLabelText('Heures estimées')).toHaveAttribute(
      'step',
      '0.01'
    );
    expect(screen.getByLabelText('Notes')).toHaveAttribute('maxlength', '1000');
  });

  it('envoie les valeurs saisies', async () => {
    const action = vi.fn<Action>(async (state) => state);
    const user = userEvent.setup();
    renderForm(action);

    await user.type(screen.getByLabelText('Nom'), 'Ponçage');
    await user.type(screen.getByLabelText('Heures estimées'), '7.5');
    await user.click(screen.getByRole('button', { name: 'Ajouter la phase' }));

    expect(action).toHaveBeenCalledTimes(1);
    const data = action.mock.calls[0][1];
    expect(data.get('name')).toBe('Ponçage');
    expect(data.get('estimatedHours')).toBe('7.5');
  });

  it('affiche le message et les erreurs de champ renvoyés par l’action, et garde la saisie', async () => {
    const action = vi.fn<Action>(async () => ({
      message: 'Certaines informations sont invalides. Vérifiez les champs.',
      fieldErrors: { estimatedHours: PHASE_FIELD_MESSAGES.estimatedHours },
      values: { name: 'Saisie gardée', estimatedHours: '1.234', notes: '' },
    }));
    const user = userEvent.setup();
    renderForm(action);

    await user.type(screen.getByLabelText('Nom'), 'x');
    await user.click(screen.getByRole('button', { name: 'Ajouter la phase' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Certaines informations sont invalides.'
    );
    expect(screen.getByLabelText('Heures estimées')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(
      screen.getByLabelText('Heures estimées')
    ).toHaveAccessibleDescription(PHASE_FIELD_MESSAGES.estimatedHours);
    expect(screen.getByLabelText('Nom')).toHaveValue('Saisie gardée');
  });

  it('n’affiche aucun message avant l’envoi', () => {
    renderForm(vi.fn());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('DeletePhaseForm', () => {
  it('porte un nom accessible qui désigne la phase', () => {
    render(
      <DeletePhaseForm action={vi.fn(async () => undefined)} name="Usinage" />
    );

    expect(
      screen.getByRole('button', { name: 'Supprimer la phase Usinage' })
    ).toBeInTheDocument();
  });

  it('appelle l’action de suppression à l’envoi', async () => {
    const action = vi.fn(async () => undefined);
    const user = userEvent.setup();
    render(<DeletePhaseForm action={action} name="Usinage" />);

    await user.click(
      screen.getByRole('button', { name: 'Supprimer la phase Usinage' })
    );

    expect(action).toHaveBeenCalledTimes(1);
  });
});
