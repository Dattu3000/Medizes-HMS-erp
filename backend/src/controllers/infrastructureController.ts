import { Request, Response } from 'express';
import { prisma } from '../utils/db';

// ====== BED & WARD MANAGEMENT ======
export const getBeds = async (req: Request, res: Response) => {
    try {
        const wards = await prisma.ward.findMany({
            include: {
                beds: {
                    include: {
                        admissions: {
                            where: { status: 'ADMITTED' },
                            include: { patient: true }
                        }
                    }
                }
            }
        });
        res.status(200).json(wards);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching beds', error });
    }
};

export const createBed = async (req: Request, res: Response) => {
    try {
        const { wardId, bedNumber, dailyRent } = req.body;
        const bed = await prisma.bed.create({
            data: { wardId, bedNumber, dailyRent: Number(dailyRent) }
        });
        res.status(201).json(bed);
    } catch (error) {
        res.status(500).json({ message: 'Error creating bed', error });
    }
};

export const createWard = async (req: Request, res: Response) => {
    try {
        const { name, type, capacity } = req.body;
        const ward = await prisma.ward.create({
            data: { name, type, capacity: Number(capacity) }
        });
        res.status(201).json(ward);
    } catch (error) {
        res.status(500).json({ message: 'Error creating ward', error });
    }
};

// ====== OT & SURGERY SCHEDULING ======
export const getSurgeries = async (req: Request, res: Response) => {
    try {
        const surgeries = await prisma.surgerySchedule.findMany({
            include: { patient: true, surgeon: true, ot: true },
            orderBy: { startTime: 'asc' }
        });
        res.status(200).json(surgeries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching surgeries', error });
    }
};

export const scheduleSurgery = async (req: Request, res: Response) => {
    try {
        const { patientId, surgeonId, otId, surgeryName, startTime, endTime, notes } = req.body;
        
        // Clash detection logic
        const start = new Date(startTime);
        const end = new Date(endTime);
        const clashingSurgeries = await prisma.surgerySchedule.findMany({
            where: {
                otId,
                status: { not: 'CANCELLED' },
                OR: [
                    { startTime: { lt: end, gte: start } },
                    { endTime: { gt: start, lte: end } },
                    { startTime: { lte: start }, endTime: { gte: end } }
                ]
            }
        });

        if (clashingSurgeries.length > 0) {
            return res.status(409).json({ message: 'OT is already booked for this time slot.' });
        }

        const surgery = await prisma.surgerySchedule.create({
            data: { patientId, surgeonId, otId, surgeryName, startTime: start, endTime: end, notes }
        });

        res.status(201).json(surgery);
    } catch (error) {
        res.status(500).json({ message: 'Error scheduling surgery', error });
    }
};

export const getOTs = async (req: Request, res: Response) => {
    try {
        const ots = await prisma.operatingTheater.findMany();
        res.status(200).json(ots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching OTs', error });
    }
};

export const createOT = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const ot = await prisma.operatingTheater.create({ data: { name } });
        res.status(201).json(ot);
    } catch (error) {
        res.status(500).json({ message: 'Error creating OT', error });
    }
};
