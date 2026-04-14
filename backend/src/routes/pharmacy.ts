import { Router } from 'express';
import { getInventory, dispenseMedicine, addMedicine, bulkAddMedicines, getPrescriptionQueue, dispensePrescription, analyzePrescriptionAI } from '../controllers/pharmacyController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const pharmRoles = ['Super Admin', 'Admin', 'Pharmacist', 'Doctor'];

router.get('/inventory', authenticate, requireRole(pharmRoles), getInventory);
router.post('/dispense', authenticate, requireRole(pharmRoles), dispenseMedicine);
router.post('/inventory', authenticate, requireRole(pharmRoles), addMedicine);
router.post('/inventory/bulk', authenticate, requireRole(pharmRoles), bulkAddMedicines);
router.get('/prescriptions', authenticate, requireRole(pharmRoles), getPrescriptionQueue);
router.post('/dispense-rx', authenticate, requireRole(pharmRoles), dispensePrescription);
router.post('/ai/analyze', authenticate, requireRole(pharmRoles), analyzePrescriptionAI);

export default router;
