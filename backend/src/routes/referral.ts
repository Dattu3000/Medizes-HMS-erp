import { Router } from 'express';
import { createReferral, getMyReferrals, consumeReferral } from '../controllers/referralController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const refRoles = ['Super Admin', 'Admin', 'Doctor'];

router.post('/', authenticate, requireRole(refRoles), createReferral);
router.get('/', authenticate, requireRole(refRoles), getMyReferrals);
router.get('/consume/:token', authenticate, requireRole(refRoles), consumeReferral);

export default router;
