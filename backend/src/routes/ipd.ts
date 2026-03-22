import { Router } from 'express';
import { getWardsAndBeds, admitPatient, getActiveAdmissions, getAdmissionDetails, addIpdCharge, dischargePatient, createWard, createBed } from '../controllers/ipdController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/wards', authenticate, getWardsAndBeds);
router.get('/admissions', authenticate, getActiveAdmissions);
router.get('/admissions/:id', authenticate, getAdmissionDetails);
router.post('/admit', authenticate, admitPatient);
router.post('/charge', authenticate, addIpdCharge);
router.post('/discharge', authenticate, dischargePatient);
router.post('/wards', authenticate, createWard);
router.post('/beds', authenticate, createBed);

export default router;
