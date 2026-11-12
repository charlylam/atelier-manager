// Cookie de session : posé par le Route Handler de connexion, lu côté serveur.
export const SESSION_COOKIE = 'token';

// Durée de vie du cookie : un jour, comme le jeton JWT (JWT_EXPIRES_IN=1d côté API).
export const SESSION_MAX_AGE = 60 * 60 * 24;
