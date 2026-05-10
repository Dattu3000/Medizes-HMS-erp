import { Router } from 'express';
import { safetyCheck } from '../controllers/aiController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const clinicalRoles = ['Super Admin', 'Admin', 'Doctor', 'Nurse', 'Lab Tech'];

router.get('/safety-check/:patientId', authenticate, requireRole(clinicalRoles), safetyCheck);

export default router;
