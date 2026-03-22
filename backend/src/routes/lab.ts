import { Router } from 'express';
import { getCatalog, getOrders, orderTest, updateOrderStatus, addLabTest } from '../controllers/labController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/catalog', authenticate, getCatalog);
router.get('/orders', authenticate, getOrders);
router.post('/order', authenticate, orderTest);
router.put('/order/:id', authenticate, updateOrderStatus);
router.post('/catalog', authenticate, addLabTest);

export default router;
