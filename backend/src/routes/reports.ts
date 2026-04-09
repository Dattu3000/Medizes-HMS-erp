import { Router } from 'express';
import { getBalanceSheet, getGSTReport, getPayrollCompliance, getAnalytics } from '../controllers/reportsController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const reportRoles = ['Super Admin', 'Admin', 'HR Admin', 'Billing', 'Accounts'];

router.get('/balance-sheet', authenticate, requireRole(reportRoles), getBalanceSheet);
router.get('/gst', authenticate, requireRole(reportRoles), getGSTReport);
router.get('/payroll-compliance', authenticate, requireRole(reportRoles), getPayrollCompliance);
router.get('/analytics', authenticate, requireRole(reportRoles), getAnalytics);

export default router;
