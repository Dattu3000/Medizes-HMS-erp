import { Router } from 'express';
import { getCatalog, getOrders, orderTest, updateOrderStatus, addLabTest } from '../controllers/labController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const labRoles = ['Super Admin', 'Admin', 'Lab Tech', 'Doctor'];

router.get('/catalog', authenticate, requireRole(labRoles), getCatalog);
router.get('/orders', authenticate, requireRole(labRoles), getOrders);
router.post('/order', authenticate, requireRole(labRoles), orderTest);
router.put('/order/:id', authenticate, requireRole(labRoles), updateOrderStatus);
router.post('/catalog', authenticate, requireRole(['Super Admin', 'Admin', 'Lab Tech']), addLabTest);

export default router;
