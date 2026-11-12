// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineForm } from '@/components/quotes/LineForm';
import { DEFAULT_LINE_VALUES, LINE_FIELD_MESSAGES } from '@/lib/line-form';
import type { LineFormState } from '@/lib/line-form';

type Action = (
  state: LineFormState,
  formData: FormData
) => Promise<LineFormState>;

function renderForm(
  action: Action,
  props: { values?: typeof DEFAULT_LINE_VALUES; cancelHref?: string } = {}
) {
  return render(
    <LineForm
      action={action}
      initialValues={props.values ?? DEFAULT_LINE_VALUES}
      submitLabel="Ajouter la ligne"
      pendingLabel="Ajout…"
      cancelHref={props.cancelHref}
    />
  );
}

describe('LineForm', () => {
  it('démarre sur un matériau en quantité 1 avec 20 % de TVA', () => {
    renderForm(vi.fn());

    expect(screen.getByLabelText('Type')).toHaveValue('material');
    expect(screen.getByLabelText('Quantité')).toHaveValue(1);
    expect(screen.getByLabelText('TVA (%)')).toHaveValue(20);
    expect(screen.getByLabelText('Désignation')).toHaveValue('');
  });

  it('propose les quatre types de ligne, en français', () => {
    renderForm(vi.fn());

    const labels = Array.from(
      screen.getByLabelText('Type').querySelectorAll('option')
    ).map((option) => option.textContent);
    expect(labels).toEqual(['Matériau', 'Main-d’œuvre', 'Prestation', 'Autre']);
  });

  it('limite les champs comme l’API : deux décimales, quantité positive, TVA de 0 à 99,99', () => {
    renderForm(vi.fn());

    expect(screen.getByLabelText('Quantité')).toHaveAttribute('min', '0.01');
    expect(screen.getByLabelText('Quantité')).toHaveAttribute('step', '0.01');
    expect(screen.getByLabelText('Prix unitaire HT (€)')).toHaveAttribute(
      'min',
      '0'
    );
    expect(screen.getByLabelText('Prix unitaire HT (€)')).toHaveAttribute(
      'step',
      '0.01'
    );
    expect(screen.getByLabelText('TVA (%)')).toHaveAttribute('max', '99.99');
    expect(screen.getByLabelText('Désignation')).toHaveAttribute(
      'maxlength',
      '200'
    );
    expect(screen.getByLabelText('Unité')).toHaveAttribute('maxlength', '20');
  });

  it('n’affiche « Annuler » que lorsqu’on lui donne une destination', () => {
    const { unmount } = renderForm(vi.fn());
    expect(
      screen.queryByRole('link', { name: 'Annuler' })
    ).not.toBeInTheDocument();
    unmount();

    renderForm(vi.fn(), { cancelHref: '/devis/5' });
    expect(screen.getByRole('link', { name: 'Annuler' })).toHaveAttribute(
      'href',
      '/devis/5'
    );
  });

  it('envoie les valeurs saisies à l’action', async () => {
    const action = vi.fn<Action>(async (state) => state);
    const user = userEvent.setup();
    renderForm(action);

    await user.type(screen.getByLabelText('Désignation'), 'Chêne massif');
    await user.type(screen.getByLabelText('Unité'), 'm²');
    await user.type(screen.getByLabelText('Prix unitaire HT (€)'), '180');
    await user.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));

    const formData = action.mock.calls[0][1] as FormData;
    expect(formData.get('type')).toBe('material');
    expect(formData.get('label')).toBe('Chêne massif');
    expect(formData.get('quantity')).toBe('1');
    expect(formData.get('unit')).toBe('m²');
    expect(formData.get('unitPrice')).toBe('180');
    expect(formData.get('vatRate')).toBe('20');
  });

  it('garde le type choisi après un refus du serveur', async () => {
    const action = vi.fn(
      async (
        _state: LineFormState,
        formData: FormData
      ): Promise<LineFormState> => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { unitPrice: LINE_FIELD_MESSAGES.unitPrice },
        values: {
          type: String(formData.get('type')),
          label: String(formData.get('label')),
          quantity: '1',
          unit: String(formData.get('unit')),
          unitPrice: '',
          vatRate: '20',
        },
      })
    );
    const user = userEvent.setup();
    renderForm(action);

    await user.selectOptions(screen.getByLabelText('Type'), 'labor');
    await user.type(screen.getByLabelText('Désignation'), 'Pose');
    await user.type(screen.getByLabelText('Unité'), 'h');
    await user.type(screen.getByLabelText('Prix unitaire HT (€)'), '45');
    await user.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText('Type')).toHaveValue('labor');
    expect(screen.getByLabelText('Désignation')).toHaveValue('Pose');
  });

  it('affiche l’erreur du champ renvoyée par l’action, et garde la saisie', async () => {
    const action = vi.fn(
      async (
        _state: LineFormState,
        formData: FormData
      ): Promise<LineFormState> => ({
        fieldErrors: { unitPrice: LINE_FIELD_MESSAGES.unitPrice },
        values: {
          type: 'material',
          label: String(formData.get('label')),
          quantity: '1',
          unit: String(formData.get('unit')),
          unitPrice: '12.345',
          vatRate: '20',
        },
      })
    );
    const user = userEvent.setup();
    renderForm(action);

    await user.type(screen.getByLabelText('Désignation'), 'Chêne');
    await user.type(screen.getByLabelText('Unité'), 'm²');
    await user.type(screen.getByLabelText('Prix unitaire HT (€)'), '12');
    await user.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));

    expect(
      await screen.findByLabelText('Prix unitaire HT (€)')
    ).toHaveAccessibleDescription(LINE_FIELD_MESSAGES.unitPrice);
    expect(screen.getByLabelText('Désignation')).toHaveValue('Chêne');
    expect(screen.getByLabelText('Unité')).toHaveValue('m²');
  });
});
