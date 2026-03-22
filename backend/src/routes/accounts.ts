import { Router } from 'express';
import { getAccountSummary, getExpenses, addExpense, payExpense } from '../controllers/accountsController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/summary', authenticate, getAccountSummary);
router.get('/expenses', authenticate, getExpenses);
router.post('/expenses', authenticate, addExpense);
router.put('/expenses/:id/pay', authenticate, payExpense);

export default router;
