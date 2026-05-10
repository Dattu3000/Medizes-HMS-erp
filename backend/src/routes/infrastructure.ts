import { Router } from 'express';
import { getBeds, createBed, createWard, getSurgeries, scheduleSurgery, getOTs, createOT } from '../controllers/infrastructureController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

router.get('/beds', authenticate, getBeds);
router.post('/beds', authenticate, createBed);
router.post('/wards', authenticate, createWard);

router.get('/surgeries', authenticate, getSurgeries);
router.post('/surgeries', authenticate, scheduleSurgery);
router.get('/ots', authenticate, getOTs);
router.post('/ots', authenticate, createOT);

export default router;
