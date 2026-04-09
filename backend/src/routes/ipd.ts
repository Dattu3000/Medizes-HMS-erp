import { Router } from 'express';
import { getWardsAndBeds, admitPatient, getActiveAdmissions, getAdmissionDetails, addIpdCharge, dischargePatient, createWard, createBed } from '../controllers/ipdController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const ipdRoles = ['Super Admin', 'Admin', 'Doctor', 'Nurse'];

router.get('/wards', authenticate, requireRole(ipdRoles), getWardsAndBeds);
router.get('/admissions', authenticate, requireRole(ipdRoles), getActiveAdmissions);
router.get('/admissions/:id', authenticate, requireRole(ipdRoles), getAdmissionDetails);
router.post('/admit', authenticate, requireRole(ipdRoles), admitPatient);
router.post('/charge', authenticate, requireRole(ipdRoles), addIpdCharge);
router.post('/discharge', authenticate, requireRole(['Super Admin', 'Admin', 'Doctor']), dischargePatient);
router.post('/wards', authenticate, requireRole(['Super Admin', 'Admin']), createWard);
router.post('/beds', authenticate, requireRole(['Super Admin', 'Admin']), createBed);

export default router;
