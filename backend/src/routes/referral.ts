import { Router } from 'express';
import { createReferral, getMyReferrals, consumeReferral } from '../controllers/referralController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticate, createReferral);
router.get('/', authenticate, getMyReferrals);
router.get('/consume/:token', authenticate, consumeReferral);

export default router;
