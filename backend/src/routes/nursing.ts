import { Router } from 'express';
import { recordVitals, getVitals } from '../controllers/nursingController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const nursingRoles = ['Super Admin', 'Admin', 'Doctor', 'Nurse'];

router.post('/vitals', authenticate, requireRole(nursingRoles), recordVitals);
router.get('/vitals/:admissionId', authenticate, requireRole(nursingRoles), getVitals);

export default router;
