// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeletePhaseForm } from '@/components/worksites/DeletePhaseForm';
import { PhaseForm } from '@/components/worksites/PhaseForm';
import { EMPTY_PHASE_VALUES, PHASE_FIELD_MESSAGES } from '@/lib/phase-form';
import type { PhaseFormState, PhaseFormValues } from '@/lib/phase-form';

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

  it('propose un lien d’annulation seulement s’il est demandé', () => {
    const { unmount } = renderForm(vi.fn());
    expect(screen.queryByRole('link', { name: 'Annuler' })).toBeNull();
    unmount();

    render(
      <PhaseForm
        action={vi.fn()}
        initialValues={{ name: 'Usinage', estimatedHours: '12.50', notes: '' }}
        submitLabel="Enregistrer"
        pendingLabel="Enregistrement…"
        cancelHref="/chantiers/4"
      />
    );
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      '/chantiers/4'
    );
    expect(screen.getByLabelText('Nom')).toHaveValue('Usinage');
    expect(screen.getByLabelText('Heures estimées')).toHaveValue(12.5);
  });

  describe('quand les valeurs initiales changent', () => {
    const VALUES_A: PhaseFormValues = {
      name: 'Ponçage',
      estimatedHours: '7.5',
      notes: 'Grain 120',
    };
    const VALUES_B: PhaseFormValues = {
      name: 'Vernissage',
      estimatedHours: '12',
      notes: 'Deux couches',
    };

    function formWith(
      values: PhaseFormValues,
      action: Action = vi.fn<Action>(async (state) => state)
    ) {
      return (
        <PhaseForm
          action={action}
          initialValues={values}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref="/chantiers/4"
        />
      );
    }

    it('affiche les nouvelles valeurs (valeurs A, puis valeurs B)', () => {
      const { rerender } = render(formWith(VALUES_A));
      expect(screen.getByLabelText('Nom')).toHaveValue('Ponçage');

      rerender(formWith(VALUES_B));

      expect(screen.getByLabelText('Nom')).toHaveValue('Vernissage');
      expect(screen.getByLabelText('Heures estimées')).toHaveValue(12);
      expect(screen.getByLabelText('Notes')).toHaveValue('Deux couches');
    });

    it('remplace les valeurs affichées par un état issu d’un envoi précédent', async () => {
      // Le formulaire a renvoyé un état (refus) avec ses propres valeurs, puis les données changent.
      const refuse = vi.fn<Action>(async () => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: {},
        values: { ...VALUES_A, name: 'Saisie refusée' },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A, refuse));
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('Nom')).toHaveValue('Saisie refusée');

      rerender(formWith(VALUES_B, refuse));

      expect(screen.getByLabelText('Nom')).toHaveValue('Vernissage');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('conserve la saisie tant que les valeurs initiales sont identiques', async () => {
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A));

      await user.clear(screen.getByLabelText('Nom'));
      await user.type(screen.getByLabelText('Nom'), 'Brouillon en cours');
      // Nouvel objet, même contenu : ce que renvoie la page à chaque rendu.
      rerender(formWith({ ...VALUES_A }));

      expect(screen.getByLabelText('Nom')).toHaveValue('Brouillon en cours');
    });

    it('conserve la saisie et l’erreur après un refus du serveur', async () => {
      const refuse = vi.fn<Action>(async (_state, formData) => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { estimatedHours: PHASE_FIELD_MESSAGES.estimatedHours },
        values: { ...VALUES_A, name: String(formData.get('name')) },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A, refuse));

      await user.clear(screen.getByLabelText('Nom'));
      await user.type(screen.getByLabelText('Nom'), 'Phase refusée');
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      rerender(formWith({ ...VALUES_A }, refuse));

      expect(screen.getByLabelText('Nom')).toHaveValue('Phase refusée');
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Heures estimées')
      ).toHaveAccessibleDescription(PHASE_FIELD_MESSAGES.estimatedHours);
    });
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
