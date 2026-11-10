import { Router } from 'express';
import {
  addQuote,
  addQuoteLine,
  copyQuote,
  downloadQuotePdf,
  getQuote,
  listQuotes,
  removeQuoteLine,
  updateQuote,
  updateQuoteLine,
  updateQuoteStatus,
} from '../controllers/quote.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

export const router = Router();

// Toutes les routes devis exigent un utilisateur connecté.
router.use(authenticate);

router.get('/', listQuotes);
router.post('/', addQuote);
router.get('/:id', getQuote);
router.patch('/:id', updateQuote);
router.patch('/:id/status', updateQuoteStatus);
router.post('/:id/lines', addQuoteLine);
router.patch('/:id/lines/:lineId', updateQuoteLine);
router.delete('/:id/lines/:lineId', removeQuoteLine);
router.post('/:id/duplicate', copyQuote);
router.get('/:id/pdf', downloadQuotePdf);
