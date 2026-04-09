import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

export const recordVitals = async (req: Request, res: Response) => {
    try {
        const { admissionId, bp, heartRate, temperature, spo2, respiratoryRate, notes } = req.body;
        const userId = (req as any).user.id;

        const admission = await prisma.admission.findUnique({ where: { id: admissionId } });
        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        const vitals = await prisma.nursingVitals.create({
            data: {
                admissionId,
                bp,
                heartRate: heartRate ? parseInt(heartRate) : null,
                temperature: temperature ? parseFloat(temperature) : null,
                spo2: spo2 ? parseInt(spo2) : null,
                respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
                notes,
                recordedBy: userId
            }
        });

        await logAudit(userId, 'VITALS_RECORDED', { admissionId, vitalsId: vitals.id }, req.ip || null);
        res.status(201).json({ message: 'Vitals recorded', vitals });
    } catch (error) {
        res.status(500).json({ message: 'Failed to record vitals', error });
    }
};

export const getVitals = async (req: Request, res: Response) => {
    try {
        const { admissionId } = req.params;

        const vitals = await prisma.nursingVitals.findMany({
            where: { admissionId: String(admissionId) },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.status(200).json(vitals);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch vitals', error });
    }
};
