import express from 'express';
import { getClaims, createClaim, updateClaimStatus, getClaimsAnalytics, getProviders } from '../controllers/claimsController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.get('/providers', getProviders);
router.get('/analytics', getClaimsAnalytics);
router.get('/', getClaims);
router.post('/', createClaim);
router.put('/:id/status', updateClaimStatus);

export default router;
