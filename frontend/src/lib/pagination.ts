/**
 * Lien vers une page de liste, en gardant les autres paramètres (recherche...).
 * La page 1 n'ajoute aucun paramètre : /clients?search=durand.
 */
export function pageHref(
  basePath: string,
  params: Record<string, string | undefined>,
  page: number
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }
  if (page > 1) {
    query.set('page', String(page));
  }

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}
