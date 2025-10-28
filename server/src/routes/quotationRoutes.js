import { Router } from 'express';
import {
  createQuotation,
  getQuotation,
  listQuotations,
  updateQuotationStatus,
} from '../controllers/quotationController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/', listQuotations);
router.get('/:id', getQuotation);
router.post('/', createQuotation);
router.put('/:id/status', updateQuotationStatus);

export default router;
