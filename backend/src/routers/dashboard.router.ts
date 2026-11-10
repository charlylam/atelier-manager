import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const router = Router();

// Le tableau de bord exige un utilisateur connecté.
router.use(authenticate);

router.get('/', getDashboardSummary);
