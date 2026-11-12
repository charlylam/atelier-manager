// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientForm } from '@/components/clients/ClientForm';
import { EMPTY_VALUES } from '@/lib/client-form';
import type { ClientFormState } from '@/lib/client-form';

// Régression : après un refus du serveur, la liste « Type de client » revenait à « Particulier ».
describe('ClientForm : choix de la liste déroulante après un refus du serveur', () => {
  it('garde « Entreprise », au premier envoi comme aux suivants', async () => {
    const action = vi.fn(
      async (
        _state: ClientFormState,
        formData: FormData
      ): Promise<ClientFormState> => ({
        message: 'Certaines informations sont invalides. Vérifiez les champs.',
        fieldErrors: { email: 'Adresse e-mail invalide.' },
        values: {
          ...EMPTY_VALUES,
          name: String(formData.get('name')),
          isCompany: formData.get('isCompany') === 'true' ? 'true' : 'false',
          email: '',
        },
      })
    );
    const user = userEvent.setup();
    render(
      <ClientForm
        action={action}
        initialValues={EMPTY_VALUES}
        submitLabel="Créer le client"
        pendingLabel="Création…"
        cancelHref="/clients"
      />
    );

    await user.type(screen.getByLabelText('Nom'), 'Dubois');
    await user.selectOptions(screen.getByLabelText('Type de client'), 'true');
    await user.click(screen.getByRole('button', { name: 'Créer le client' }));
    await screen.findByRole('alert');

    expect(screen.getByLabelText('Nom')).toHaveValue('Dubois');
    expect(screen.getByLabelText('Type de client')).toHaveValue('true');

    await user.click(screen.getByRole('button', { name: 'Créer le client' }));
    expect(action).toHaveBeenCalledTimes(2);
    expect(await screen.findByLabelText('Type de client')).toHaveValue('true');

    await user.selectOptions(screen.getByLabelText('Type de client'), 'false');
    await user.click(screen.getByRole('button', { name: 'Créer le client' }));
    expect(action).toHaveBeenCalledTimes(3);
    expect(await screen.findByLabelText('Type de client')).toHaveValue('false');
  });
});
