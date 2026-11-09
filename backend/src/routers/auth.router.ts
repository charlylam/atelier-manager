import { Router } from 'express';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { createLimiter } from '../middlewares/rateLimit.middleware.js';

export const router = Router();

const maxAttempts = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5);

// Connexion : seuls les échecs comptent (5 par fenêtre de 15 minutes et par IP).
const loginLimiter = createLimiter({
  limit: maxAttempts,
  skipSuccessfulRequests: true,
});

// Inscription : toutes les tentatives comptent, sur une heure.
const registerLimiter = createLimiter({
  limit: maxAttempts,
  windowMs: 60 * 60 * 1000,
});

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);
router.get('/me', authenticate, getCurrentUser);
