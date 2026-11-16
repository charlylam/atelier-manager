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
});
