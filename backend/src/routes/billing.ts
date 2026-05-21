import { Router } from 'express';
import { getPatientPendingBills, processPayment, getVisitInvoice, getGlobalPendingBills } from '../controllers/billingController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const billingRoles = ['Super Admin', 'Admin', 'Billing', 'Accounts'];

// IMPORTANT: Put /pending/all before /:uhid to avoid "pending" being matched as uhid
router.get('/pending/all', authenticate, requireRole(billingRoles), getGlobalPendingBills);
router.get('/visit/:visitId', authenticate, requireRole(billingRoles), getVisitInvoice);
router.get('/:uhid', authenticate, requireRole(billingRoles), getPatientPendingBills);
router.post('/pay', authenticate, requireRole(billingRoles), processPayment);

export default router;
