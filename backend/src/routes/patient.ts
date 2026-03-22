import { Router } from 'express';
import { registerPatient, searchPatients, createVisit, getDoctors } from '../controllers/patientController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Assuming standard authentication checks for all
router.post('/register', authenticate, registerPatient);
router.get('/search', authenticate, searchPatients);
router.post('/visit', authenticate, createVisit);
router.get('/doctors', authenticate, getDoctors);

export default router;
