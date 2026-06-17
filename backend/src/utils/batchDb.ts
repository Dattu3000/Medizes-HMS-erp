import { PrismaClient } from '@prisma/client';
import { financialAuditExtension } from './auditExtension';

/**
 * Medisys HMS v6.0 — Dedicated Batch/Cron Database Client
 * 
 * Uses BATCH_CRON_DATABASE_URL with a restricted connection pool size (e.g., max 3)
 * to run background workers without starving connections from the main transactional web server.
 * 
 * Note: RLS session injection and automatic app-layer branch scoping are excluded here,
 * as cron/batch operations run in a system-wide background context. We still chain 
 * financialAuditExtension to ensure mutations to Ledger/Disbursement are audited.
 */
const baseBatchPrisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.BATCH_CRON_DATABASE_URL,
        },
    },
});

export const batchPrisma = baseBatchPrisma.$extends(financialAuditExtension);
