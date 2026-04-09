import { Router } from 'express';
import { getInventory, dispenseMedicine, addMedicine, bulkAddMedicines, getPrescriptionQueue, dispensePrescription } from '../controllers/pharmacyController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/inventory', authenticate, getInventory);
router.post('/dispense', authenticate, dispenseMedicine);
router.post('/inventory', authenticate, addMedicine);
router.post('/inventory/bulk', authenticate, bulkAddMedicines);
router.get('/prescriptions', authenticate, getPrescriptionQueue);
router.post('/dispense-rx', authenticate, dispensePrescription);

export default router;
