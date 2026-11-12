import { describe, expect, it } from 'vitest';
import { firstValue, parseId, parsePage, parseSearch } from '@/lib/params';

describe('firstValue', () => {
  it('prend la première valeur d’un paramètre répété', () => {
    expect(firstValue(['a', 'b'])).toBe('a');
    expect(firstValue('a')).toBe('a');
    expect(firstValue(undefined)).toBeUndefined();
  });
});

describe('parsePage', () => {
  it('accepte un entier positif', () => {
    expect(parsePage('1')).toBe(1);
    expect(parsePage('12')).toBe(12);
  });

  it('revient à la page 1 pour une valeur absente ou invalide', () => {
    for (const value of [
      undefined,
      '',
      '0',
      '-3',
      '2.5',
      'abc',
      '10001',
      '99999999999999999999',
    ]) {
      expect(parsePage(value), String(value)).toBe(1);
    }
  });
});

describe('parseSearch', () => {
  it('retire les espaces autour du texte', () => {
    expect(parseSearch('  durand ')).toBe('durand');
  });

  it('renvoie undefined pour un texte vide', () => {
    expect(parseSearch(undefined)).toBeUndefined();
    expect(parseSearch('   ')).toBeUndefined();
  });

  it('tronque à 100 caractères, limite de l’API', () => {
    expect(parseSearch('a'.repeat(150))).toHaveLength(100);
  });
});

describe('parseId', () => {
  it('accepte un entier positif', () => {
    expect(parseId('42')).toBe(42);
  });

  it('refuse tout ce qui n’est pas un entier positif', () => {
    for (const value of ['abc', '-1', '1.5', '', '12abc', '1234567890']) {
      expect(parseId(value), value).toBeUndefined();
    }
  });
});
