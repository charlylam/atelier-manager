import { Router } from 'express';
import { router as authRouter } from './auth.router.js';
import { router as clientRouter } from './client.router.js';
import { router as dashboardRouter } from './dashboard.router.js';
import { router as quoteRouter } from './quote.router.js';
import { router as worksiteRouter } from './worksite.router.js';

export const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
});

router.use('/auth', authRouter);
router.use('/clients', clientRouter);
router.use('/dashboard', dashboardRouter);
router.use('/quotes', quoteRouter);
router.use('/worksites', worksiteRouter);
