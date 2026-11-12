/**
 * Destination après connexion, reçue dans l'URL (?redirect=...). Seul un chemin
 * interne est accepté : "//autre-site.com" ou "https://..." renverraient
 * l'utilisateur vers un site extérieur (redirection ouverte).
 */
export function safeRedirectPath(
  value: string | undefined,
  fallback = '/tableau-de-bord'
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }
  if (value.includes('\\')) {
    return fallback;
  }
  return value;
}
