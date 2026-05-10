import { Router } from 'express';
import { registerDevice, ingestDeviceVitals, getDevices } from '../controllers/iotController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', authenticate, registerDevice);
router.post('/vitals', authenticate, ingestDeviceVitals);
router.get('/devices', authenticate, getDevices);

export default router;
