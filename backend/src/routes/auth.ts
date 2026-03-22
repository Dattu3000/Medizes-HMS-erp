import { Router } from 'express';
import { login, verifyOtp, generateOtpSetup } from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.get('/setup-2fa', authenticate, generateOtpSetup);

export default router;
