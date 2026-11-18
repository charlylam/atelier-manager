// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteForm } from '@/components/quotes/QuoteForm';
import { EMPTY_QUOTE_VALUES, QUOTE_FIELD_MESSAGES } from '@/lib/quote-form';
import type { QuoteFormState, QuoteFormValues } from '@/lib/quote-form';

type Action = (
  state: QuoteFormState,
  formData: FormData
) => Promise<QuoteFormState>;

const CLIENTS = [
  { id: 3, code: 'CLI-0001', name: 'Famille Durand' },
  { id: 4, code: 'CLI-0002', name: 'Menuiserie Dubois' },
];

function renderForm(action: Action, values = EMPTY_QUOTE_VALUES) {
  return render(
    <QuoteForm
      action={action}
      initialValues={values}
      clients={CLIENTS}
      submitLabel="Créer le brouillon"
      pendingLabel="Création…"
      cancelHref="/devis"
    />
  );
}

describe('QuoteForm', () => {
  it('propose les clients, avec leur code, après un choix vide', () => {
    renderForm(vi.fn());

    const options = within(screen.getByLabelText('Client')).getAllByRole(
      'option'
    );
    expect(options.map((option) => option.textContent)).toEqual([
      'Choisir un client',
      'Famille Durand (CLI-0001)',
      'Menuiserie Dubois (CLI-0002)',
    ]);
    expect(screen.getByLabelText('Client')).toBeRequired();
    expect(screen.getByLabelText('Titre')).toBeRequired();
    expect(screen.getByLabelText('Titre')).toHaveAttribute('maxlength', '200');
    expect(screen.getByLabelText('Valable jusqu’au')).toHaveAttribute(
      'type',
      'date'
    );
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      '/devis'
    );
  });

  it('préremplit un devis existant', () => {
    renderForm(vi.fn(), {
      clientId: '4',
      title: 'Porte',
      description: 'Vitrée',
      validUntil: '2026-12-31',
    });

    expect(screen.getByLabelText('Client')).toHaveValue('4');
    expect(screen.getByLabelText('Titre')).toHaveValue('Porte');
    expect(screen.getByLabelText('Description')).toHaveValue('Vitrée');
    expect(screen.getByLabelText('Valable jusqu’au')).toHaveValue('2026-12-31');
  });

  it('envoie les valeurs saisies à l’action', async () => {
    const action = vi.fn<Action>(async (state) => state);
    const user = userEvent.setup();
    renderForm(action);

    await user.selectOptions(screen.getByLabelText('Client'), '4');
    await user.type(screen.getByLabelText('Titre'), 'Bibliothèque');
    await user.click(
      screen.getByRole('button', { name: 'Créer le brouillon' })
    );

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get('clientId')).toBe('4');
    expect(formData.get('title')).toBe('Bibliothèque');
  });

  it('affiche le message et l’erreur du champ renvoyés par l’action, et garde la saisie', async () => {
    const action = vi.fn(
      async (
        _state: QuoteFormState,
        formData: FormData
      ): Promise<QuoteFormState> => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { validUntil: QUOTE_FIELD_MESSAGES.validUntil },
        values: {
          clientId: String(formData.get('clientId')),
          title: String(formData.get('title')),
          description: '',
          validUntil: '',
        },
      })
    );
    const user = userEvent.setup();
    renderForm(action);

    await user.selectOptions(screen.getByLabelText('Client'), '3');
    await user.type(screen.getByLabelText('Titre'), 'Bibliothèque');
    await user.click(
      screen.getByRole('button', { name: 'Créer le brouillon' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Certaines informations sont invalides'
    );
    expect(
      screen.getByLabelText('Valable jusqu’au')
    ).toHaveAccessibleDescription(QUOTE_FIELD_MESSAGES.validUntil);
    expect(screen.getByLabelText('Valable jusqu’au')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Client')).toHaveValue('3');
    expect(screen.getByLabelText('Titre')).toHaveValue('Bibliothèque');
  });

  describe('quand les valeurs initiales changent', () => {
    const VALUES_A: QuoteFormValues = {
      clientId: '3',
      title: 'Bibliothèque',
      description: 'Chêne massif',
      validUntil: '2026-12-31',
    };
    const VALUES_B: QuoteFormValues = {
      clientId: '4',
      title: 'Porte d’entrée',
      description: 'Vitrée',
      validUntil: '2027-01-15',
    };

    function formWith(
      values: QuoteFormValues,
      action: Action = vi.fn<Action>(async (state) => state)
    ) {
      return (
        <QuoteForm
          action={action}
          initialValues={values}
          clients={CLIENTS}
          submitLabel="Enregistrer"
          pendingLabel="Enregistrement…"
          cancelHref="/devis/7"
        />
      );
    }

    it('affiche les nouvelles valeurs (valeurs A, puis valeurs B)', () => {
      const { rerender } = render(formWith(VALUES_A));
      expect(screen.getByLabelText('Client')).toHaveValue('3');

      rerender(formWith(VALUES_B));

      expect(screen.getByLabelText('Client')).toHaveValue('4');
      expect(screen.getByLabelText('Titre')).toHaveValue('Porte d’entrée');
      expect(screen.getByLabelText('Description')).toHaveValue('Vitrée');
      expect(screen.getByLabelText('Valable jusqu’au')).toHaveValue(
        '2027-01-15'
      );
    });

    it('remplace les valeurs affichées par un état issu d’un envoi précédent', async () => {
      // Le formulaire a renvoyé un état (refus) avec ses propres valeurs, puis les données changent.
      const refuse = vi.fn<Action>(async () => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: {},
        values: { ...VALUES_A, clientId: '4', description: 'Saisie refusée' },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A, refuse));
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toHaveValue(
        'Saisie refusée'
      );
      expect(screen.getByLabelText('Client')).toHaveValue('4');

      rerender(formWith({ ...VALUES_B, clientId: '3' }, refuse));

      expect(screen.getByLabelText('Description')).toHaveValue('Vitrée');
      expect(screen.getByLabelText('Client')).toHaveValue('3');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('conserve la saisie tant que les valeurs initiales sont identiques', async () => {
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A));

      await user.clear(screen.getByLabelText('Titre'));
      await user.type(screen.getByLabelText('Titre'), 'Brouillon en cours');
      await user.selectOptions(screen.getByLabelText('Client'), '4');
      // Nouvel objet, même contenu : ce que renvoie la page à chaque rendu.
      rerender(formWith({ ...VALUES_A }));

      expect(screen.getByLabelText('Titre')).toHaveValue('Brouillon en cours');
      expect(screen.getByLabelText('Client')).toHaveValue('4');
    });

    it('conserve la saisie et l’erreur après un refus du serveur', async () => {
      const refuse = vi.fn<Action>(async (_state, formData) => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { validUntil: QUOTE_FIELD_MESSAGES.validUntil },
        values: {
          ...VALUES_A,
          clientId: String(formData.get('clientId')),
          title: String(formData.get('title')),
        },
      }));
      const user = userEvent.setup();
      const { rerender } = render(formWith(VALUES_A, refuse));

      await user.clear(screen.getByLabelText('Titre'));
      await user.type(screen.getByLabelText('Titre'), 'Brouillon refusé');
      await user.selectOptions(screen.getByLabelText('Client'), '4');
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
      expect(await screen.findByRole('alert')).toBeInTheDocument();

      rerender(formWith({ ...VALUES_A }, refuse));

      expect(screen.getByLabelText('Titre')).toHaveValue('Brouillon refusé');
      expect(screen.getByLabelText('Client')).toHaveValue('4');
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Valable jusqu’au')
      ).toHaveAccessibleDescription(QUOTE_FIELD_MESSAGES.validUntil);
    });
  });
});
