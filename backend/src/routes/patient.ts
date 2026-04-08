import { Router } from 'express';
import { registerPatient, searchPatients, createVisit, getDoctors, getDoctorEHR, submitClinicalNote } from '../controllers/patientController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Assuming standard authentication checks for all
router.post('/register', authenticate, registerPatient);
router.get('/search', authenticate, searchPatients);
router.post('/visit', authenticate, createVisit);
router.get('/doctors', authenticate, getDoctors);
router.get('/ehr/visits', authenticate, getDoctorEHR);
router.put('/ehr/note/:visitId', authenticate, submitClinicalNote);

export default router;
