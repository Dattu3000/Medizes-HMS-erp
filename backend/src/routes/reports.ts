import { Router } from 'express';
import {
    getBalanceSheet, getGSTReport, getPayrollCompliance, getAnalytics,
    getRevenueByDoctor, getRevenueByDepartment, getCollectionEfficiency,
    getRevenueTrend, getExpenseTrend, getBedOccupancy, getLabVolume,
    getPatientDemographics
} from '../controllers/reportsController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const reportRoles = ['Super Admin', 'Admin', 'HR Admin', 'Billing', 'Accounts', 'ADMIN'];

// Legacy
router.get('/balance-sheet', authenticate, requireRole(reportRoles), getBalanceSheet);
router.get('/gst', authenticate, requireRole(reportRoles), getGSTReport);
router.get('/payroll-compliance', authenticate, requireRole(reportRoles), getPayrollCompliance);
router.get('/analytics', authenticate, requireRole(reportRoles), getAnalytics);

// Expert Intelligence
router.get('/revenue-by-doctor', authenticate, requireRole(reportRoles), getRevenueByDoctor);
router.get('/revenue-by-department', authenticate, requireRole(reportRoles), getRevenueByDepartment);
router.get('/collection-efficiency', authenticate, requireRole(reportRoles), getCollectionEfficiency);
router.get('/revenue-trend', authenticate, requireRole(reportRoles), getRevenueTrend);
router.get('/expense-trend', authenticate, requireRole(reportRoles), getExpenseTrend);
router.get('/bed-occupancy', authenticate, requireRole(reportRoles), getBedOccupancy);
router.get('/lab-volume', authenticate, requireRole(reportRoles), getLabVolume);
router.get('/patient-demographics', authenticate, requireRole(reportRoles), getPatientDemographics);

export default router;
