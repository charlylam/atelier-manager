// Lecture des paramètres d'URL (?search=...&page=...) : une valeur invalide est
// ignorée au lieu de provoquer une erreur 400 de l'API.

const MAX_PAGE = 10_000;
const MAX_SEARCH_LENGTH = 100; // limite de l'API

/** Valeur d'un paramètre d'URL, qui peut être répété (?search=a&search=b) : la première. */
export function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

/** Numéro de page : un entier de 1 à 10 000, sinon 1. */
export function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1;
}

/** Texte de recherche sans espaces autour, tronqué à la limite de l'API ; undefined s'il est vide. */
export function parseSearch(value?: string) {
  const search = value?.trim() ?? '';
  return search === '' ? undefined : search.slice(0, MAX_SEARCH_LENGTH);
}

/** Identifiant dans l'URL (/clients/12) : undefined s'il n'est pas un entier positif. */
export function parseId(value: string) {
  return /^\d{1,9}$/.test(value) ? Number(value) : undefined;
}
