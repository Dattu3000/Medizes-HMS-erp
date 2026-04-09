import { Router } from 'express';
import { getAccountSummary, getExpenses, addExpense, payExpense } from '../controllers/accountsController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const accRoles = ['Super Admin', 'Admin', 'Accounts'];

router.get('/summary', authenticate, requireRole(accRoles), getAccountSummary);
router.get('/expenses', authenticate, requireRole(accRoles), getExpenses);
router.post('/expenses', authenticate, requireRole(accRoles), addExpense);
router.put('/expenses/:id/pay', authenticate, requireRole(accRoles), payExpense);

export default router;
