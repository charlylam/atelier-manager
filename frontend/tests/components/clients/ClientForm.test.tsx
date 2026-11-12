// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientForm } from '@/components/clients/ClientForm';
import { EMPTY_VALUES, FIELD_MESSAGES } from '@/lib/client-form';
import type { ClientFormState } from '@/lib/client-form';

type Action = (
  state: ClientFormState,
  formData: FormData
) => Promise<ClientFormState>;

function renderForm(action: Action, values = EMPTY_VALUES) {
  return render(
    <ClientForm
      action={action}
      initialValues={values}
      submitLabel="Créer le client"
      pendingLabel="Création…"
      cancelHref="/clients"
    />
  );
}

describe('ClientForm', () => {
  it('affiche les champs, préremplis avec les valeurs reçues', () => {
    renderForm(vi.fn(), {
      ...EMPTY_VALUES,
      name: 'Menuiserie Dubois',
      isCompany: 'true',
      email: 'a@b.fr',
    });

    expect(screen.getByLabelText('Nom')).toHaveValue('Menuiserie Dubois');
    expect(screen.getByLabelText('Type de client')).toHaveValue('true');
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('a@b.fr');
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      '/clients'
    );
  });

  it('exige un nom et limite la longueur des champs, comme l’API', () => {
    renderForm(vi.fn());

    expect(screen.getByLabelText('Nom')).toBeRequired();
    expect(screen.getByLabelText('Nom')).toHaveAttribute('maxlength', '150');
    expect(screen.getByLabelText('Téléphone')).toHaveAttribute(
      'maxlength',
      '30'
    );
    expect(screen.getByLabelText('Adresse')).toHaveAttribute(
      'maxlength',
      '200'
    );
    expect(screen.getByLabelText('Notes')).toHaveAttribute('maxlength', '1000');
  });

  it('envoie les valeurs saisies à l’action', async () => {
    const action = vi.fn<Action>(async (state) => state);
    const user = userEvent.setup();
    renderForm(action);

    await user.type(screen.getByLabelText('Nom'), 'Famille Durand');
    await user.type(
      screen.getByLabelText('Adresse e-mail'),
      'durand@example.test'
    );
    await user.click(screen.getByRole('button', { name: 'Créer le client' }));

    expect(action).toHaveBeenCalledTimes(1);
    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get('name')).toBe('Famille Durand');
    expect(formData.get('email')).toBe('durand@example.test');
    expect(formData.get('isCompany')).toBe('false');
  });

  it('affiche le message et l’erreur du champ renvoyés par l’action, et garde la saisie', async () => {
    const action = vi.fn(
      async (
        _state: ClientFormState,
        formData: FormData
      ): Promise<ClientFormState> => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { email: FIELD_MESSAGES.email },
        values: {
          ...EMPTY_VALUES,
          name: String(formData.get('name')),
          email: String(formData.get('email')),
        },
      })
    );
    const user = userEvent.setup();
    renderForm(action);

    await user.type(screen.getByLabelText('Nom'), 'Durand');
    await user.type(screen.getByLabelText('Adresse e-mail'), 'x@y.z');
    await user.click(screen.getByRole('button', { name: 'Créer le client' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Certaines informations sont invalides'
    );
    expect(screen.getByText(FIELD_MESSAGES.email)).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute(
      'aria-describedby',
      'client-email-error'
    );
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAccessibleDescription(
      FIELD_MESSAGES.email
    );
    expect(screen.getByLabelText('Nom')).toHaveValue('Durand');
    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('x@y.z');
  });
});
