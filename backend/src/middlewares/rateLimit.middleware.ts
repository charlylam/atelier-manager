import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../lib/errors.js';

type LimiterOptions = {
  limit: number;
  windowMs?: number;
  // true : seules les réponses en échec (statut 400 et plus) sont comptées.
  skipSuccessfulRequests?: boolean;
};

export function createLimiter({
  limit,
  windowMs = 15 * 60 * 1000,
  skipSuccessfulRequests = false,
}: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  });
}
