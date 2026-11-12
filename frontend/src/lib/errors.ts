// Détail d'une erreur de validation de l'API : champ concerné (path) et message.
export type ApiErrorDetail = { path: string; message: string };

// Erreur renvoyée par l'API : porte le vrai code HTTP et le code applicatif
// (VALIDATION_ERROR, UNAUTHORIZED, CONFLICT...), pour que l'appelant puisse
// répondre précisément au lieu d'une erreur 500 générique.
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: ApiErrorDetail[];

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
