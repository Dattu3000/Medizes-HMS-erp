import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

export const getWardsAndBeds = async (req: Request, res: Response) => {
    try {
        const wards = await prisma.ward.findMany({
            include: {
                beds: true
            }
        });
        res.status(200).json(wards);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch wards', error });
    }
};

export const admitPatient = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, bedId, depositAmount } = req.body;
        const userId = (req as any).user.id;

        const admission = await prisma.$transaction(async (tx) => {
            // Create admission
            const adm = await tx.admission.create({
                data: {
                    patientId,
                    doctorId,
                    bedId,
                    depositAmount: depositAmount ? Number(depositAmount) : 0,
                    status: 'ADMITTED'
                }
            });

            // Update Bed Status
            await tx.bed.update({
                where: { id: bedId },
                data: { status: 'OCCUPIED' }
            });

            return adm;
        });

        await logAudit(userId, 'PATIENT_ADMITTED', { admissionId: admission.id, patientId }, req.ip || null);

        res.status(201).json({ message: 'Patient admitted successfully', admission });
    } catch (error) {
        res.status(500).json({ message: 'Failed to admit patient', error });
    }
};

export const getActiveAdmissions = async (req: Request, res: Response) => {
    try {
        const admissions = await prisma.admission.findMany({
            where: { status: 'ADMITTED' },
            include: {
                patient: true,
                bed: { include: { ward: true } },
                doctor: true,
            }
        });

        res.status(200).json(admissions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch admissions', error });
    }
};

export const getAdmissionDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const admission = await prisma.admission.findUnique({
            where: { id: String(id) },
            include: {
                patient: true,
                bed: { include: { ward: true } },
                doctor: true,
                ipdCharges: { orderBy: { dateAdded: 'desc' } },
                bills: true
            }
        });

        if (!admission) return res.status(404).json({ message: "Admission not found" });

        res.status(200).json(admission);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch admission details', error });
    }
};

export const addIpdCharge = async (req: Request, res: Response) => {
    try {
        const { admissionId, chargeType, description, amount } = req.body;
        const userId = (req as any).user.id;

        const charge = await prisma.ipdCharge.create({
            data: {
                admissionId,
                chargeType,
                description,
                amount: Number(amount)
            }
        });

        await logAudit(userId, 'IPD_CHARGE_ADDED', { admissionId, chargeId: charge.id, amount }, req.ip || null);

        res.status(201).json({ message: 'Charge added', charge });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add charge', error });
    }
};

export const dischargePatient = async (req: Request, res: Response) => {
    try {
        const { admissionId, paymentMode } = req.body;
        const userId = (req as any).user.id;

        const result = await prisma.$transaction(async (tx) => {
            const admission = await tx.admission.findUnique({
                where: { id: admissionId },
                include: { ipdCharges: true, bed: true }
            });

            if (!admission || admission.status === 'DISCHARGED') {
                throw new Error('Invalid admission or already discharged');
            }

            // Calculate totals
            const subTotal = admission.ipdCharges.reduce((sum, ch) => sum + ch.amount, 0);
            const gstAmount = subTotal * 0.18; // assuming flat 18% for simplicity on hospital bill

            // Calculate deposit impact
            const grossPayable = subTotal + gstAmount;
            const netPayable = grossPayable - admission.depositAmount;

            const billNo = `BL-IPD-${Date.now()}`;

            // Create Final Bill
            const bill = await tx.bill.create({
                data: {
                    billNo,
                    patientId: admission.patientId,
                    admissionId: admission.id,
                    type: 'IPD_FINAL',
                    subTotal,
                    gstAmount,
                    discount: 0,
                    netPayable: netPayable > 0 ? netPayable : 0,
                    paymentMode: paymentMode || 'CASH',
                    status: 'UNPAID'
                }
            });

            // Update admission
            await tx.admission.update({
                where: { id: admissionId },
                data: {
                    status: 'DISCHARGED',
                    dischargeDate: new Date()
                }
            });

            // Free up bed
            await tx.bed.update({
                where: { id: admission.bedId },
                data: { status: 'AVAILABLE' }
            });

            return bill;
        });

        await logAudit(userId, 'PATIENT_DISCHARGED', { admissionId, billNo: result.billNo }, req.ip || null);

        res.status(200).json({ message: 'Patient discharged and bill generated', bill: result });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to discharge patient', error: error.message });
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
        res.status(500).json({ message: 'Failed to create ward', error });
    }
};

export const createBed = async (req: Request, res: Response) => {
    try {
        const { bedNumber, wardId, dailyRent } = req.body;
        const bed = await prisma.bed.create({
            data: { bedNumber, wardId, dailyRent: Number(dailyRent), status: 'AVAILABLE' }
        });
        res.status(201).json(bed);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create bed', error });
    }
};
