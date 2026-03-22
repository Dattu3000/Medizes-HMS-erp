import { Router } from 'express';
import { getPatientPendingBills, processPayment } from '../controllers/billingController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:uhid', authenticate, getPatientPendingBills);
router.post('/pay', authenticate, processPayment);

export default router;
