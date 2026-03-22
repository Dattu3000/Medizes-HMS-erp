import { Router } from 'express';
import { getBalanceSheet, getGSTReport, getPayrollCompliance, getAnalytics } from '../controllers/reportsController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/balance-sheet', authenticate, getBalanceSheet);
router.get('/gst', authenticate, getGSTReport);
router.get('/payroll-compliance', authenticate, getPayrollCompliance);
router.get('/analytics', authenticate, getAnalytics);

export default router;
