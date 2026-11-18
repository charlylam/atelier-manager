// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientForm } from '@/components/clients/ClientForm';
import { EMPTY_VALUES, FIELD_MESSAGES } from '@/lib/client-form';
import type { ClientFormState, ClientFormValues } from '@/lib/client-form';

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

  describe('quand les valeurs initiales changent', () => {
    const VALUES_A: ClientFormValues = {
      name: 'Famille Durand',
      isCompany: 'false',
      email: 'durand@example.test',
      phone: '06 12 34 56 78',
      address: '12 rue des Lilas',
      notes: 'Client fidèle',
    };
    const VALUES_B: ClientFormValues = {
      name: 'Menuiserie Dubois',
      isCompany: 'true',
      email: 'contact@dubois.test',
      phone: '04 74 00 00 00',
      address: '5 place du Marché',
      notes: 'Nouveau contact',
    };

    function formWith(
      values: ClientFormValues,
      action: Action = vi.fn<Action>(async (state) => state)
    ) {
      return (
        <ClientForm
          action={action}
          initialValues={values}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref="/clients/3"
        />
      );
    }

    it('affiche les nouvelles valeurs (valeurs A, puis valeurs B)', () => {
      const { rerender } = render(formWith(VALUES_A));
      expect(screen.getByLabelText('Type de client')).toHaveValue('false');

      rerender(formWith(VALUES_B));

      expect(screen.getByLabelText('Nom')).toHaveValue('Menuiserie Dubois');
      expect(screen.getByLabelText('Type de client')).toHaveValue('true');
      expect(screen.getByLabelText('Adresse e-mail')).toHaveValue(
        'contact@dubois.test'
      );
      expect(screen.getByLabelText('Téléphone')).toHaveValue('04 74 00 00 00');
      expect(screen.getByLabelText('Adresse')).toHaveValue('5 place du Marché');
      expect(screen.getByLabelText('Notes')).toHaveValue('Nouveau contact');
    });

    it('remplace les valeurs affichées par un état issu d’un envoi précédent', async () => {
      // Le formulaire a renvoyé un état (refus) avec ses propres valeurs, puis les données changent.
      const refuse = vi.fn<Action>(async () => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: {},
        values: { ...VALUES_A, phone: '0' },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A, refuse));
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('Téléphone')).toHaveValue('0');

      rerender(formWith(VALUES_B, refuse));

      expect(screen.getByLabelText('Téléphone')).toHaveValue('04 74 00 00 00');
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
        fieldErrors: { email: FIELD_MESSAGES.email },
        values: { ...VALUES_A, name: String(formData.get('name')) },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A, refuse));

      await user.clear(screen.getByLabelText('Nom'));
      await user.type(screen.getByLabelText('Nom'), 'Brouillon refusé');
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      rerender(formWith({ ...VALUES_A }, refuse));

      expect(screen.getByLabelText('Nom')).toHaveValue('Brouillon refusé');
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(FIELD_MESSAGES.email)).toBeInTheDocument();
    });
  });
});
