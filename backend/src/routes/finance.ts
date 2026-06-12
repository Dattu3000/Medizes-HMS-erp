import { Router } from 'express';
import { postTransaction } from '../controllers/financeController';
import { reconcileGst, uploadPurchaseRegister, uploadGstr2b } from '../controllers/gstController';
import { exportGstr3b, exportTds26q } from '../controllers/exportController';

const router = Router();

// POST /api/v1/finance/transactions
router.post('/transactions', postTransaction);

// GST Reconciliation Routes
router.post('/gst/upload-pr', uploadPurchaseRegister);
router.post('/gst/upload-2b', uploadGstr2b);
router.get('/gst/reconcile/:returnPeriod', reconcileGst);

// Statutory Exporters
router.get('/gst/export-3b/:returnPeriod', exportGstr3b);
router.get('/tds/export-26q/:returnPeriod', exportTds26q);

export default router;
