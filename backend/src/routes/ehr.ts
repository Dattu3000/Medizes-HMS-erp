import { Router } from 'express';
import { ambientScribe } from '../controllers/ehrController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const doctorRoles = ['Super Admin', 'Admin', 'Doctor'];

router.post('/ambient-scribe', authenticate, requireRole(doctorRoles), ambientScribe);

export default router;
