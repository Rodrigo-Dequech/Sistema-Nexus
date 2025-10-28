import { Router } from 'express';
import {
  createService,
  createServiceType,
  deleteService,
  deleteServiceType,
  listServices,
  updateService,
  updateServiceType,
} from '../controllers/serviceController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/', listServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.post('/:serviceId/types', createServiceType);
router.put('/types/:serviceTypeId', updateServiceType);
router.delete('/types/:serviceTypeId', deleteServiceType);

export default router;
