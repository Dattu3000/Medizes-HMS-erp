import { PrismaClient, Prisma } from '@prisma/client';
import { contextStorage } from '../security/context';
import { financialAuditExtension } from './auditExtension';

// ============================================================================
// RLS Session Injection Extension
// ============================================================================
// Injects `SET LOCAL app.current_tenant_id = '<branchId>'` into the PostgreSQL
// session context at the start of every database operation. This primes the
// Row-Level Security (RLS) policies defined in rls_policies.sql so that the
// database itself enforces tenant isolation — a second layer of defense
// alongside the application-layer Prisma query filter below.
// ============================================================================
const rlsSessionExtension = Prisma.defineExtension((client) => {
    return client.$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query }: any) {
                    const context = contextStorage.getStore();
                    if (context?.branchId) {
                        // SET LOCAL scopes the setting to the current transaction only,
                        // preventing leakage across pooled connections.
                        await (client as any).$executeRawUnsafe(
                            `SET LOCAL app.current_tenant_id = '${context.branchId}'`
                        );
                    }
                    return query(args);
                },
            },
        },
    });
});

/**
 * Medisys HMS v6.0 — Isolated Prisma Client with Automatic Branch Scoping
 *
 * Uses Prisma Client Extensions ($extends) to intercept ALL database
 * operations and inject branchId filters/data based on the current
 * AsyncLocalStorage execution context.
 *
 * Bypass conditions:
 *   1. No context exists (cron jobs, seed scripts, migrations)
 *   2. Authenticated user role is 'Super Admin' (enterprise diagnostics)
 *
 * Model guard:
 *   Only injects branchId on models whose schema definition includes
 *   a branchId field, checked dynamically via Prisma DMMF metadata.
 */

const basePrisma = new PrismaClient();

// Build a Set of model names that have a branchId field for fast lookup
const branchScopedModels = new Set<string>();
for (const model of Prisma.dmmf.datamodel.models) {
    const hasBranchId = model.fields.some((f: any) => f.name === 'branchId');
    if (hasBranchId) {
        branchScopedModels.add(model.name);
    }
}

export const prisma = basePrisma.$extends(rlsSessionExtension).$extends(financialAuditExtension).$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }: any) {
                const context = contextStorage.getStore();

                // Bypass 1: No HTTP context (cron jobs, seed scripts, etc.)
                if (!context) {
                    return query(args);
                }

                // Bypass 2: Super Admin has unrestricted cross-branch access
                if (context.role === 'Super Admin') {
                    return query(args);
                }

                // Model guard: Only inject on models that have a branchId column
                if (!model || !branchScopedModels.has(model)) {
                    return query(args);
                }

                const targetBranchId = context.branchId;

                // === READ operations: inject WHERE filter ===
                if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                    args.where = {
                        ...args.where,
                        branchId: targetBranchId,
                    };
                }

                // === CREATE operations: force branchId into data ===
                if (operation === 'create') {
                    args.data = {
                        ...args.data,
                        branchId: targetBranchId,
                    };
                }

                if (operation === 'createMany') {
                    if (Array.isArray(args.data)) {
                        args.data = args.data.map((item: any) => ({
                            ...item,
                            branchId: targetBranchId,
                        }));
                    } else if (args.data) {
                        args.data = {
                            ...args.data,
                            branchId: targetBranchId,
                        };
                    }
                }

                // === UPDATE / DELETE operations: inject WHERE filter ===
                if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operation)) {
                    args.where = {
                        ...args.where,
                        branchId: targetBranchId,
                    };
                }

                // === UPSERT: also force branchId into create data ===
                if (operation === 'upsert') {
                    if (args.create) {
                        args.create = {
                            ...args.create,
                            branchId: targetBranchId,
                        };
                    }
                }

                return query(args);
            },
        },
    },
});
