import { Router } from 'express';
import {
  createPatient,
  deletePatient,
  listPatients,
  updatePatient,
} from '../controllers/patientController.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorizeAdmin);

router.get('/', listPatients);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
