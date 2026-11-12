// Erreur renvoyée par l'API : porte le vrai code HTTP et le code applicatif
// (VALIDATION_ERROR, UNAUTHORIZED, CONFLICT...), pour que l'appelant puisse
// répondre précisément au lieu d'une erreur 500 générique.
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}
