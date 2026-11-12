// Messages affichés à l'utilisateur, selon le code d'erreur de l'API.
const MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    'Certaines informations sont invalides. Vérifiez les champs.',
  UNAUTHORIZED: 'E-mail ou mot de passe incorrect.',
  CONFLICT: 'Cet e-mail ou ce nom d’atelier est déjà utilisé.',
  TOO_MANY_REQUESTS: 'Trop de tentatives. Réessayez dans quelques minutes.',
  API_UNREACHABLE:
    'Le service est momentanément indisponible. Réessayez plus tard.',
};

export function messageForCode(code?: string) {
  return (code && MESSAGES[code]) || 'Une erreur est survenue. Réessayez.';
}
