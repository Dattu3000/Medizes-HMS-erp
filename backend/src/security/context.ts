import { AsyncLocalStorage } from 'async_hooks';

/**
 * Medisys HMS v6.0 — Zero-Trust Request Context Manager
 *
 * Uses Node.js AsyncLocalStorage to securely propagate the authenticated
 * user's branch context across the entire async call stack without
 * modifying function signatures or polluting global state.
 */

export interface RequestContext {
    branchId: string;
    role: string;
    userId: string;
    ipAddress?: string;
}

export const contextStorage = new AsyncLocalStorage<RequestContext>();
