import { Router } from 'express';
import {
  addClient,
  getClient,
  listClients,
  removeClient,
  updateClient,
} from '../controllers/client.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const router = Router();

// Toutes les routes clients exigent un utilisateur connecté.
router.use(authenticate);

router.get('/', listClients);
router.post('/', addClient);
router.get('/:id', getClient);
router.patch('/:id', updateClient);
router.delete('/:id', removeClient);
