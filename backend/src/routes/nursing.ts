import { Router } from 'express';
import { recordVitals, getVitals } from '../controllers/nursingController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/vitals', authenticate, recordVitals);
router.get('/vitals/:admissionId', authenticate, getVitals);

export default router;
