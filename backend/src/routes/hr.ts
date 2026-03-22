import { Router } from 'express';
import { getEmployees, markAttendance, getAttendance, getPayroll, generatePayroll, processPayroll } from '../controllers/hrController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/employees', authenticate, getEmployees);
router.post('/attendance', authenticate, markAttendance);
router.get('/attendance', authenticate, getAttendance);

router.get('/payroll', authenticate, getPayroll);
router.post('/payroll', authenticate, generatePayroll);
router.put('/payroll/:id/process', authenticate, processPayroll);

export default router;
