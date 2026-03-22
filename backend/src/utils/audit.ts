import { prisma } from './db';

export const logAudit = async (userId: string, action: string, details: any, ipAddress: string | null = null) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details: JSON.stringify(details),
                ipAddress,
            },
        });
    } catch (error) {
        console.error('Failed to log audit:', error);
    }
};
