import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';
import crypto from 'crypto';

export const createReferral = async (req: Request, res: Response) => {
    try {
        const { patientId, toHospital, reason } = req.body;
        const userId = (req as any).user.id;

        // Find doctor's employee record
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(403).json({ message: 'No employee profile found' });

        const referral = await prisma.referral.create({
            data: {
                fromDoctorId: employee.id,
                patientId,
                toHospital,
                reason,
                referralToken: crypto.randomUUID(),
                status: 'PENDING'
            },
            include: { patient: true }
        });

        await logAudit(userId, 'REFERRAL_CREATED', { referralId: referral.id, toHospital }, req.ip || null);

        res.status(201).json({ message: 'Referral created', referral });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create referral', error });
    }
};

export const getMyReferrals = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(403).json({ message: 'No employee profile' });

        const referrals = await prisma.referral.findMany({
            where: { fromDoctorId: employee.id },
            include: { patient: true },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(referrals);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch referrals', error });
    }
};

export const consumeReferral = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const referral = await prisma.referral.findUnique({
            where: { referralToken: String(token) },
            include: {
                patient: {
                    include: {
                        visits: { take: 5, orderBy: { createdAt: 'desc' } },
                        labOrders: { take: 10, orderBy: { createdAt: 'desc' } }
                    }
                }
            }
        });

        if (!referral) return res.status(404).json({ message: 'Invalid referral token' });

        // Mark as ACCEPTED
        await prisma.referral.update({
            where: { id: referral.id },
            data: { status: 'ACCEPTED' }
        });

        res.status(200).json({ message: 'Referral consumed', referral });
    } catch (error) {
        res.status(500).json({ message: 'Failed to consume referral', error });
    }
};
