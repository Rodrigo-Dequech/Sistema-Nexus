import { Router } from 'express';
import {
  createQuotation,
  getQuotation,
  listQuotations,
  updateQuotationStatus,
  authorizeQuotation,
  generateQuotationBudget,
} from '../controllers/quotationController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/', listQuotations);
router.get('/:id', getQuotation);
router.post('/', createQuotation);
router.put('/:id/status', updateQuotationStatus);
router.post('/:id/authorize', authorizeQuotation);
router.get('/:id/budget', generateQuotationBudget);

export default router;
