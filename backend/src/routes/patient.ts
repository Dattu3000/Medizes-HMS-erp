import { Router } from 'express';
import { registerPatient, searchPatients, createVisit, getDoctors, getDoctorEHR, submitClinicalNote, orderLabFromEHR, createPrescription, updateVisitStatus } from '../controllers/patientController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Standard patient routes
router.post('/register', authenticate, registerPatient);
router.get('/search', authenticate, searchPatients);
router.post('/visit', authenticate, createVisit);
router.get('/doctors', authenticate, getDoctors);

// EHR routes (Scenarios 1 & 2)
router.get('/ehr/visits', authenticate, getDoctorEHR);
router.put('/ehr/note/:visitId', authenticate, submitClinicalNote);
router.post('/ehr/lab-order', authenticate, orderLabFromEHR);
router.post('/ehr/prescription', authenticate, createPrescription);
router.put('/ehr/visit-status/:visitId', authenticate, updateVisitStatus);

export default router;
