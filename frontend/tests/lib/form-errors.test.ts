import { describe, expect, it } from 'vitest';
import { fieldErrorsFromDetails } from '@/lib/form-errors';

const FIELDS = ['title', 'email'] as const;
const MESSAGES = { title: 'Titre obligatoire.', email: 'E-mail invalide.' };

describe('fieldErrorsFromDetails', () => {
  it('remplace le texte de l’API par nos messages, champ par champ', () => {
    expect(
      fieldErrorsFromDetails(FIELDS, MESSAGES, [
        { path: 'email', message: 'Invalid email address' },
        { path: 'title', message: 'Too small' },
      ])
    ).toEqual({ email: MESSAGES.email, title: MESSAGES.title });
  });

  it('ignore les champs inconnus et l’absence de détail', () => {
    expect(
      fieldErrorsFromDetails(FIELDS, MESSAGES, [
        { path: 'autre', message: 'x' },
      ])
    ).toEqual({});
    expect(fieldErrorsFromDetails(FIELDS, MESSAGES, undefined)).toEqual({});
  });
});
