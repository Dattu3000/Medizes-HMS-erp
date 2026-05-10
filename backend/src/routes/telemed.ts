import { Router } from 'express';
import { createTelemedSession, getTelemedSession, endTelemedSession } from '../controllers/telemedController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/session', createTelemedSession);
router.get('/session/:visitId', getTelemedSession);
router.put('/session/:visitId/end', endTelemedSession);

export default router;
