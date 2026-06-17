import { Prisma } from '@prisma/client';
import { contextStorage } from '../security/context';

/**
 * Medisys HMS v6.0 — Immutable Audit Trail Extension
 * 
 * Intercepts all mutating queries to "Ledger" and "Disbursement" tables.
 * Stores historical snapshots of altered state in the "FinancialAuditLog" table.
 * Utilizes RequestContext to bind changes to the responsible user and IP.
 */
export const financialAuditExtension = Prisma.defineExtension((client) => {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }: any) {
                    // Check if model is target of auditing
                    if (!['Ledger', 'Disbursement'].includes(model)) {
                        return query(args);
                    }

                    // Check if the operation is mutating
                    const isMutating = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation);
                    if (!isMutating) {
                        return query(args);
                    }

                    const context = contextStorage.getStore();
                    const userId = context?.userId || 'SYSTEM_CRON_CONTEXT';
                    const ip = context?.ipAddress || '127.0.0.1';
                    const tenantId = context?.branchId || null;

                    // Capture old snapshot for updates/deletes/upserts
                    let oldSnapshot: any = null;
                    let recordId = args.where?.id || '';

                    if (['update', 'delete', 'upsert'].includes(operation) && args.where && args.where.id) {
                        try {
                            // Query the database directly to get the current state before the modification
                            // Since read operation is not mutating, this will not trigger audit recursion
                            oldSnapshot = await (client as any)[model].findUnique({
                                where: { id: args.where.id }
                            });
                            if (oldSnapshot) {
                                recordId = oldSnapshot.id;
                            }
                        } catch (err) {
                            console.error('[AUDIT EXTENSION] Pre-fetch old snapshot failed:', err);
                        }
                    }

                    // Perform the database mutation
                    const result = await query(args);

                    // Formulate audit log parameters
                    let newSnapshot: any = null;
                    let action = '';

                    if (operation === 'create') {
                        action = 'CREATE';
                        newSnapshot = result;
                        recordId = result?.id || '';
                    } else if (operation === 'update') {
                        action = 'UPDATE';
                        newSnapshot = result;
                    } else if (operation === 'delete') {
                        action = 'DELETE';
                    } else if (operation === 'upsert') {
                        action = oldSnapshot ? 'UPDATE' : 'CREATE';
                        newSnapshot = result;
                        recordId = result?.id || '';
                    } else if (operation === 'createMany') {
                        action = 'CREATE_MANY';
                        newSnapshot = args.data;
                    } else if (operation === 'updateMany') {
                        action = 'UPDATE_MANY';
                        newSnapshot = args.data;
                    } else if (operation === 'deleteMany') {
                        action = 'DELETE_MANY';
                    }

                    try {
                        // Persist the audit log entry in the database
                        await (client as any).financialAuditLog.create({
                            data: {
                                tableName: model,
                                recordId: String(recordId || 'UNKNOWN'),
                                action,
                                oldSnapshot: oldSnapshot ? JSON.parse(JSON.stringify(oldSnapshot)) : undefined,
                                newSnapshot: newSnapshot ? JSON.parse(JSON.stringify(newSnapshot)) : undefined,
                                changedByUserId: userId,
                                ipAddress: ip,
                                tenantId: tenantId
                            }
                        });
                    } catch (err) {
                        console.error('[AUDIT EXTENSION] Writing audit log failed:', err);
                    }

                    return result;
                }
            }
        }
    });
});
