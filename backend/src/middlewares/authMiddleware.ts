import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';

interface AuthPayload {
    userId: string;
    roleId: string;
    branchId: string;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing' });
        }

        const secret = process.env.JWT_SECRET || 'supersecret';
        const decoded = jwt.verify(token, secret) as AuthPayload;

        // Check if user is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User is inactive or not found' });
        }

        (req as any).user = {
            id: user.id,
            role: user.role.name,
            branchId: user.branchId,
            employeeId: user.employeeId
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token', error });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).user?.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({ message: 'Access Denied: Insufficient permissions' });
        }
        next();
    };
};
