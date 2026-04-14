import { Router } from 'express';
import { getCatalog, getOrders, orderTest, updateOrderStatus, addLabTest, updateSampleStatus, getLabReport, generateLabInterpretationAI } from '../controllers/labController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const labRoles = ['Super Admin', 'Admin', 'Lab Tech', 'Doctor'];

router.get('/catalog', authenticate, requireRole(labRoles), getCatalog);
router.get('/orders', authenticate, requireRole(labRoles), getOrders);
router.post('/order', authenticate, requireRole(labRoles), orderTest);
router.put('/order/:id', authenticate, requireRole(labRoles), updateOrderStatus);
router.put('/order/:id/sample', authenticate, requireRole(labRoles), updateSampleStatus);
router.get('/report/:orderId', authenticate, requireRole(labRoles), getLabReport);
router.post('/catalog', authenticate, requireRole(['Super Admin', 'Admin', 'Lab Tech']), addLabTest);
router.post('/ai/interpret', authenticate, requireRole(labRoles), generateLabInterpretationAI);

export default router;
