import { Router } from 'express';
import { createEmployeeUser, getSystemMetadata } from '../controllers/adminController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Only HR Admin or general Admin can create employess
router.post('/employees', authenticate, requireRole(['HR Admin', 'Super Admin', 'Admin']), createEmployeeUser);
router.get('/meta', authenticate, requireRole(['HR Admin', 'Super Admin', 'Admin']), getSystemMetadata);

export default router;
