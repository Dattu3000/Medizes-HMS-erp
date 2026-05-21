import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getClaims = async (req: Request, res: Response) => {
    try {
        const claims = await prisma.claim.findMany({
            include: {
                provider: true,
                patient: true,
                bill: true,
                documents: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(claims);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching claims', error: error.message });
    }
};

export const createClaim = async (req: Request, res: Response) => {
    try {
        const { billId, providerId, requestedAmount } = req.body;

        const bill = await prisma.bill.findUnique({
            where: { id: billId }
        });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        
        if (!bill.patientId) {
             return res.status(400).json({ message: 'Bill must be associated with a patient' });
        }

        const claimNumber = `CLM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

        const newClaim = await prisma.claim.create({
            data: {
                claimNumber,
                billId,
                patientId: bill.patientId,
                providerId,
                requestedAmount: Number(requestedAmount),
                status: 'DRAFT'
            },
            include: {
                provider: true,
                patient: true,
                bill: true
            }
        });

        res.status(201).json(newClaim);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating claim', error: error.message });
    }
};

export const updateClaimStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, approvedAmount, denialReason } = req.body;

        const updateData: any = { status };
        
        if (status === 'SUBMITTED') {
            updateData.submissionDate = new Date();
        } else if (status === 'APPROVED' || status === 'PARTIAL') {
            updateData.paymentDate = new Date();
            updateData.approvedAmount = Number(approvedAmount);
        } else if (status === 'DENIED') {
            updateData.denialReason = denialReason;
        }

        const updatedClaim = await prisma.claim.update({
            where: { id: id as string },
            data: updateData,
            include: {
                provider: true,
                patient: true,
                bill: true
            }
        });

        res.json(updatedClaim);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating claim status', error: error.message });
    }
};

export const getClaimsAnalytics = async (req: Request, res: Response) => {
    try {
        const claims = await prisma.claim.findMany();
        
        const totalClaims = claims.length;
        const totalBilled = claims.reduce((sum: number, c: any) => sum + c.requestedAmount, 0);
        
        const approvedClaims = claims.filter((c: any) => c.status === 'APPROVED' || c.status === 'PARTIAL');
        const deniedClaims = claims.filter((c: any) => c.status === 'DENIED');
        
        const totalApprovedAmount = approvedClaims.reduce((sum: number, c: any) => sum + (c.approvedAmount || 0), 0);
        
        const denialRate = totalClaims > 0 ? (deniedClaims.length / totalClaims) * 100 : 0;

        // Calculate average Days in AR for unresolved claims (SUBMITTED or IN_PROCESS)
        const unresolvedClaims = claims.filter((c: any) => ['SUBMITTED', 'IN_PROCESS'].includes(c.status) && c.submissionDate);
        let avgDaysInAR = 0;
        if (unresolvedClaims.length > 0) {
            const totalDays = unresolvedClaims.reduce((sum: number, c: any) => {
                const days = (new Date().getTime() - new Date(c.submissionDate!).getTime()) / (1000 * 3600 * 24);
                return sum + days;
            }, 0);
            avgDaysInAR = totalDays / unresolvedClaims.length;
        }

        res.json({
            totalClaims,
            totalBilled,
            totalApprovedAmount,
            denialRate,
            avgDaysInAR,
            statusCounts: {
                DRAFT: claims.filter((c: any) => c.status === 'DRAFT').length,
                SUBMITTED: claims.filter((c: any) => c.status === 'SUBMITTED').length,
                IN_PROCESS: claims.filter((c: any) => c.status === 'IN_PROCESS').length,
                APPROVED: approvedClaims.length,
                DENIED: deniedClaims.length,
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};

export const getProviders = async (req: Request, res: Response) => {
    try {
        const providers = await prisma.insuranceProvider.findMany({
             orderBy: { name: 'asc' }
        });
        res.json(providers);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching providers', error: error.message });
    }
};
