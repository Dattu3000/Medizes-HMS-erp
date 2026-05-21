import { Request, Response, NextFunction } from 'express';
import { contextStorage, RequestContext } from '../security/context';

/**
 * Medisys HMS v6.0 — Branch Context Binder Middleware
 *
 * Must be applied AFTER the authenticate middleware.
 * Reads the parsed user object from (req as any).user and opens an
 * AsyncLocalStorage execution sandbox. All downstream database
 * operations automatically inherit the branch scope.
 *
 * Requests lacking a valid branchId are rejected with HTTP 401.
 */
export const bindBranchContext = (req: Request, res: Response, next: NextFunction) => {
    const tokenData = (req as any).user;

    if (!tokenData || !tokenData.branchId) {
        return res.status(401).json({
            error: 'Access Denied: Missing cryptographic branch context.'
        });
    }

    const contextPayload: RequestContext = {
        branchId: tokenData.branchId,
        role: tokenData.role,
        userId: tokenData.id
    };

    // Run entire downstream handler chain inside an isolated async context
    contextStorage.run(contextPayload, () => {
        next();
    });
};
