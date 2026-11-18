// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorksiteForm } from '@/components/worksites/WorksiteForm';
import { WORKSITE_FIELD_MESSAGES } from '@/lib/worksite-form';
import type { WorksiteFormState } from '@/lib/worksite-form';

type Action = (
  state: WorksiteFormState,
  formData: FormData
) => Promise<WorksiteFormState>;

const VALUES = {
  title: 'Bibliothèque',
  description: 'Chêne massif',
  siteAddress: '5 place du Marché',
  dueDate: '2026-12-15',
};

function renderForm(action: Action) {
  return render(
    <WorksiteForm
      action={action}
      initialValues={VALUES}
      cancelHref="/chantiers/4"
    />
  );
}

describe('WorksiteForm', () => {
  it('préremplit le chantier et pose les contraintes des champs', () => {
    renderForm(vi.fn());

    expect(screen.getByLabelText('Titre')).toHaveValue('Bibliothèque');
    expect(screen.getByLabelText('Titre')).toBeRequired();
    expect(screen.getByLabelText('Titre')).toHaveAttribute('maxlength', '200');
    expect(screen.getByLabelText('Description')).toHaveValue('Chêne massif');
    expect(screen.getByLabelText('Adresse du chantier')).toHaveValue(
      '5 place du Marché'
    );
    expect(screen.getByLabelText('Échéance')).toHaveValue('2026-12-15');
    expect(screen.getByLabelText('Échéance')).toHaveAttribute('type', 'date');
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      '/chantiers/4'
    );
  });

  it('envoie les valeurs saisies', async () => {
    const action = vi.fn<Action>(async (state) => state);
    const user = userEvent.setup();
    renderForm(action);

    await user.clear(screen.getByLabelText('Titre'));
    await user.type(screen.getByLabelText('Titre'), 'Armoire');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(action).toHaveBeenCalledTimes(1);
    const data = action.mock.calls[0][1];
    expect(data.get('title')).toBe('Armoire');
    expect(data.get('siteAddress')).toBe('5 place du Marché');
  });

  it('affiche le message et les erreurs de champ renvoyés par l’action, et garde la saisie', async () => {
    const action = vi.fn<Action>(async () => ({
      message: 'Certaines informations sont invalides. Vérifiez les champs.',
      fieldErrors: { dueDate: WORKSITE_FIELD_MESSAGES.dueDate },
      values: { ...VALUES, title: 'Saisie gardée' },
    }));
    const user = userEvent.setup();
    renderForm(action);

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Certaines informations sont invalides.'
    );
    expect(screen.getByLabelText('Échéance')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Échéance')).toHaveAccessibleDescription(
      WORKSITE_FIELD_MESSAGES.dueDate
    );
    expect(screen.getByLabelText('Titre')).toHaveValue('Saisie gardée');
  });

  it('n’affiche aucun message avant l’envoi', () => {
    renderForm(vi.fn());

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('quand les valeurs initiales changent', () => {
    const NEW_VALUES = {
      title: 'Armoire',
      description: 'Noyer',
      siteAddress: '8 rue Neuve',
      dueDate: '2026-12-26',
    };

    function formWith(
      values: typeof VALUES,
      action: Action = vi.fn<Action>(async (state) => state)
    ) {
      return (
        <WorksiteForm
          action={action}
          initialValues={values}
          cancelHref="/chantiers/4"
        />
      );
    }

    it('affiche les nouvelles valeurs (valeurs A, puis valeurs B)', () => {
      const { rerender } = render(formWith(VALUES));
      expect(screen.getByLabelText('Échéance')).toHaveValue('2026-12-15');

      rerender(formWith(NEW_VALUES));

      expect(screen.getByLabelText('Titre')).toHaveValue('Armoire');
      expect(screen.getByLabelText('Description')).toHaveValue('Noyer');
      expect(screen.getByLabelText('Adresse du chantier')).toHaveValue(
        '8 rue Neuve'
      );
      expect(screen.getByLabelText('Échéance')).toHaveValue('2026-12-26');
    });

    it('remplace les valeurs affichées par un état issu d’un envoi précédent', async () => {
      // Le formulaire a renvoyé un état (refus) avec ses propres valeurs, puis les données changent.
      const refuse = vi.fn<Action>(async () => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: {},
        values: { ...VALUES, dueDate: '2026-11-01' },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES, refuse));
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('Échéance')).toHaveValue('2026-11-01');

      rerender(formWith(NEW_VALUES, refuse));

      expect(screen.getByLabelText('Échéance')).toHaveValue('2026-12-26');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('conserve la saisie tant que les valeurs initiales sont identiques', async () => {
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES));

      await user.clear(screen.getByLabelText('Titre'));
      await user.type(screen.getByLabelText('Titre'), 'Brouillon en cours');
      // Nouvel objet, même contenu : ce que renvoie la page à chaque rendu.
      rerender(formWith({ ...VALUES }));

      expect(screen.getByLabelText('Titre')).toHaveValue('Brouillon en cours');
    });

    it('conserve la saisie et l’erreur après un refus du serveur', async () => {
      const refuse = vi.fn<Action>(async (_state, formData) => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { dueDate: 'La date d’échéance est invalide.' },
        values: {
          title: String(formData.get('title')),
          description: VALUES.description,
          siteAddress: VALUES.siteAddress,
          dueDate: VALUES.dueDate,
        },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES, refuse));

      await user.clear(screen.getByLabelText('Titre'));
      await user.type(screen.getByLabelText('Titre'), 'Brouillon refusé');
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      rerender(formWith({ ...VALUES }, refuse));

      expect(screen.getByLabelText('Titre')).toHaveValue('Brouillon refusé');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
