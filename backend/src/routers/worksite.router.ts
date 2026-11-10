import { Router } from 'express';
import {
  addWorksite,
  addWorksitePhase,
  getWorksite,
  listWorksites,
  removeWorksitePhase,
  reorderWorksitePhases,
  updateWorksite,
  updateWorksitePhase,
  updateWorksiteStatus,
} from '../controllers/worksite.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const router = Router();

// Toutes les routes chantiers exigent un utilisateur connecté.
router.use(authenticate);

router.get('/', listWorksites);
router.post('/', addWorksite);
router.get('/:id', getWorksite);
router.patch('/:id', updateWorksite);
router.patch('/:id/status', updateWorksiteStatus);
router.post('/:id/phases', addWorksitePhase);
router.put('/:id/phases/order', reorderWorksitePhases);
router.patch('/:id/phases/:phaseId', updateWorksitePhase);
router.delete('/:id/phases/:phaseId', removeWorksitePhase);
