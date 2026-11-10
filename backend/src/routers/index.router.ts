import { Router } from 'express';
import { router as authRouter } from './auth.router.js';
import { router as clientRouter } from './client.router.js';
import { router as quoteRouter } from './quote.router.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
});

router.use('/auth', authRouter);
router.use('/clients', clientRouter);
router.use('/quotes', quoteRouter);
