import { Router } from 'express';
import {
    getAccountSummary, getExpenses, addExpense, payExpense,
    getChartOfAccounts, seedChartOfAccounts,
    createJournalEntry, getJournalEntries,
    getTrialBalance, getProfitLoss, getCashFlow,
    getReceivableAging, getPayableAging,
    getDayBook,
    getFinancialPeriods, closePeriod,
    analyzeFinancesAI
} from '../controllers/accountsController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const accRoles = ['Super Admin', 'Admin', 'Accounts', 'ADMIN', 'BILLING'];

// Legacy
router.get('/summary', authenticate, requireRole(accRoles), getAccountSummary);
router.get('/expenses', authenticate, requireRole(accRoles), getExpenses);
router.post('/expenses', authenticate, requireRole(accRoles), addExpense);
router.put('/expenses/:id/pay', authenticate, requireRole(accRoles), payExpense);

// Expert — Chart of Accounts
router.get('/chart-of-accounts', authenticate, requireRole(accRoles), getChartOfAccounts);
router.post('/chart-of-accounts/seed', authenticate, requireRole(accRoles), seedChartOfAccounts);

// Expert — Journal Entries
router.post('/journal-entries', authenticate, requireRole(accRoles), createJournalEntry);
router.get('/journal-entries', authenticate, requireRole(accRoles), getJournalEntries);

// Expert — Financial Statements
router.get('/trial-balance', authenticate, requireRole(accRoles), getTrialBalance);
router.get('/profit-loss', authenticate, requireRole(accRoles), getProfitLoss);
router.get('/cash-flow', authenticate, requireRole(accRoles), getCashFlow);

// Expert — AR/AP
router.get('/receivable-aging', authenticate, requireRole(accRoles), getReceivableAging);
router.get('/payable-aging', authenticate, requireRole(accRoles), getPayableAging);

// Expert — Day Book
router.get('/day-book', authenticate, requireRole(accRoles), getDayBook);

// Expert — Financial Periods
router.get('/periods', authenticate, requireRole(accRoles), getFinancialPeriods);
router.post('/periods/close', authenticate, requireRole(accRoles), closePeriod);

// AI Financial Advisor
router.post('/ai/analyze', authenticate, requireRole(accRoles), analyzeFinancesAI);

export default router;
