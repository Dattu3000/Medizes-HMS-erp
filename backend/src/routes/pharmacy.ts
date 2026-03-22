import { Router } from 'express';
import { getInventory, dispenseMedicine, addMedicine, bulkAddMedicines } from '../controllers/pharmacyController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/inventory', authenticate, getInventory);
router.post('/dispense', authenticate, dispenseMedicine);
router.post('/inventory', authenticate, addMedicine);
router.post('/inventory/bulk', authenticate, bulkAddMedicines);

export default router;
