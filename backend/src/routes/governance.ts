import { Router } from 'express';
import { processWorkflowAction } from '../controllers/governanceController';

const router = Router();

// POST /api/v1/governance/review
router.post('/review', processWorkflowAction);

export default router;
