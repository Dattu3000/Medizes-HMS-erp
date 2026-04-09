import { Router } from 'express';
import { getPatientPendingBills, processPayment, getVisitInvoice } from '../controllers/billingController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const billingRoles = ['Super Admin', 'Admin', 'Billing', 'Accounts'];

router.get('/visit/:visitId', authenticate, requireRole(billingRoles), getVisitInvoice);
router.get('/:uhid', authenticate, requireRole(billingRoles), getPatientPendingBills);
router.post('/pay', authenticate, requireRole(billingRoles), processPayment);

export default router;
