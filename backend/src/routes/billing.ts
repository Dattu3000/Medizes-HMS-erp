import { Router } from 'express';
import { getPatientPendingBills, processPayment, getVisitInvoice } from '../controllers/billingController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/visit/:visitId', authenticate, getVisitInvoice);
router.get('/:uhid', authenticate, getPatientPendingBills);
router.post('/pay', authenticate, processPayment);

export default router;
