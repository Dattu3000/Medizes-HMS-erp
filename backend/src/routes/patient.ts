import { Router } from 'express';
import { registerPatient, searchPatients, createVisit, getDoctors, getDoctorEHR, submitClinicalNote, orderLabFromEHR, createPrescription, updateVisitStatus } from '../controllers/patientController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

const patientRoles = ['Super Admin', 'Admin', 'Doctor', 'Nurse', 'Receptionist'];
const doctorRoles = ['Super Admin', 'Admin', 'Doctor'];

// Standard patient routes
router.post('/register', authenticate, requireRole(patientRoles), registerPatient);
router.get('/search', authenticate, requireRole(patientRoles), searchPatients);
router.post('/visit', authenticate, requireRole(patientRoles), createVisit);
router.get('/doctors', authenticate, requireRole(patientRoles), getDoctors);

// EHR routes (Scenarios 1 & 2)
router.get('/ehr/visits', authenticate, requireRole(patientRoles), getDoctorEHR);
router.put('/ehr/note/:visitId', authenticate, requireRole(doctorRoles), submitClinicalNote);
router.post('/ehr/lab-order', authenticate, requireRole(doctorRoles), orderLabFromEHR);
router.post('/ehr/prescription', authenticate, requireRole(doctorRoles), createPrescription);
router.put('/ehr/visit-status/:visitId', authenticate, requireRole(doctorRoles), updateVisitStatus);

export default router;
