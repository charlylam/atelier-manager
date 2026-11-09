import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

// Contenu attendu du JWT, signé à la connexion.
const tokenPayloadSchema = z.object({
  userId: z.number().int().positive(),
  workshopId: z.number().int().positive(),
  role: z.enum(['admin', 'member']),
});

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return undefined;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req);
  if (!token) {
    throw new UnauthorizedError('Authentication required');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // jwt.verify lève une exception sur un jeton mal formé ou expiré :
  // sans ce try/catch, le client recevrait une 500 au lieu d'une 401.
  try {
    req.user = tokenPayloadSchema.parse(jwt.verify(token, secret));
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    throw new ForbiddenError('Admin role required');
  }
  next();
}
