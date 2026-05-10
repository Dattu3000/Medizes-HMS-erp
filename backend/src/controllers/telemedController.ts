import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 1. Create a Telemedicine Session
export const createTelemedSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { visitId } = req.body;

        // Verify the visit exists
        const visit = await prisma.visit.findUnique({
            where: { id: visitId }
        });

        if (!visit) {
            res.status(404).json({ message: 'Visit not found' });
            return;
        }

        // Update visit status to WAITING_VIRTUAL
        await prisma.visit.update({
            where: { id: visitId },
            data: { status: 'WAITING_VIRTUAL' }
        });

        // Generate a simple room ID for WebRTC
        const roomLink = `/dashboard/ehr/telemed/${uuidv4()}`;

        const session = await prisma.telemedicineSession.upsert({
            where: { visitId },
            update: {
                meetingLink: roomLink,
                startTime: new Date(),
                endTime: null,
            },
            create: {
                visitId,
                meetingLink: roomLink,
                startTime: new Date(),
            }
        });

        res.status(201).json({ message: 'Telemedicine session created', session });
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating telemed session', error: error.message });
    }
};

// 2. Get Telemedicine Session details
export const getTelemedSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { visitId } = req.params;

        const session = await prisma.telemedicineSession.findUnique({
            where: { visitId: String(visitId) },
            include: {
                visit: {
                    include: { patient: true, doctor: true }
                }
            }
        });

        if (!session) {
            res.status(404).json({ message: 'Telemedicine session not found' });
            return;
        }

        res.status(200).json(session);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching telemed session', error: error.message });
    }
};

// 3. End a Telemedicine Session
export const endTelemedSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { visitId } = req.params;
        const { notes, recordingUrl } = req.body;

        const session = await prisma.telemedicineSession.update({
            where: { visitId: String(visitId) },
            data: {
                endTime: new Date(),
                recordingUrl: recordingUrl || null,
            }
        });

        // Update visit back to COMPLETED
        await prisma.visit.update({
            where: { id: String(visitId) },
            data: { 
                status: 'COMPLETED',
                notes: notes || undefined 
            }
        });

        res.status(200).json({ message: 'Telemedicine session ended', session });
    } catch (error: any) {
        res.status(500).json({ message: 'Error ending telemed session', error: error.message });
    }
};
