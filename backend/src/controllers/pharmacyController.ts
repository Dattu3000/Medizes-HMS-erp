import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

export const getInventory = async (req: Request, res: Response) => {
    try {
        const inventory = await prisma.medicineInventory.findMany({
            orderBy: { drugName: 'asc' }
        });
        res.status(200).json(inventory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch inventory', error });
    }
};

export const dispenseMedicine = async (req: Request, res: Response) => {
    try {
        const { patientId, visitId, medicines } = req.body;
        // medicines: Array<{ drugId, quantity }>
        const userId = (req as any).user.id;

        if (!medicines || medicines.length === 0) {
            return res.status(400).json({ message: 'No medicines selected for dispatch' });
        }

        const billResult = await prisma.$transaction(async (tx) => {
            let subTotal = 0;

            // Lower inventory counts
            for (const item of medicines) {
                const drug = await tx.medicineInventory.findUnique({ where: { id: item.drugId } });
                if (!drug || drug.stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${drug?.drugName || item.drugId}`);
                }

                await tx.medicineInventory.update({
                    where: { id: drug.id },
                    data: { stockQuantity: drug.stockQuantity - item.quantity }
                });

                subTotal += (drug.unitPrice * item.quantity);
            }

            // Pharmacy GST is typically 12% overall simplified here
            const gstAmount = subTotal * 0.12;
            const netPayable = subTotal + gstAmount;

            const bill = await tx.bill.create({
                data: {
                    billNo: `BL-PHAR-${Date.now()}`,
                    patientId,
                    visitId: visitId || null,
                    type: 'PHARMACY',
                    subTotal,
                    gstAmount,
                    discount: 0,
                    netPayable,
                    paymentMode: 'CASH',
                    status: 'UNPAID'
                }
            });

            return bill;
        });

        await logAudit(userId, 'PHARMACY_DISPENSED', { itemsCount: medicines.length, patientId }, req.ip || null);

        res.status(201).json({ message: 'Medicines dispensed & Billed', bill: billResult });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to dispense', error });
    }
};

export const addMedicine = async (req: Request, res: Response) => {
    try {
        const { drugName, manufacturer, batchNo, expiryDate, stockQuantity, unitPrice } = req.body;
        const medicine = await prisma.medicineInventory.create({
            data: {
                drugName,
                manufacturer,
                batchNo,
                expiryDate: new Date(expiryDate),
                stockQuantity: Number(stockQuantity),
                unitPrice: Number(unitPrice)
            }
        });
        res.status(201).json(medicine);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add medicine', error });
    }
};

export const bulkAddMedicines = async (req: Request, res: Response) => {
    try {
        const medicines = req.body;
        if (!Array.isArray(medicines)) {
            return res.status(400).json({ message: "Invalid format. Expected an array." });
        }

        await prisma.$transaction(
            medicines.map((m: any) => {
                const stockQty = parseInt(m.stockQuantity) || 0;
                const price = parseFloat(m.unitPrice) || 0;

                return prisma.medicineInventory.upsert({
                    where: { drugName: m.drugName },
                    update: {
                        stockQuantity: { increment: stockQty },
                        unitPrice: price,
                        expiryDate: new Date(m.expiryDate),
                        batchNo: m.batchNo,
                        manufacturer: m.manufacturer || ""
                    },
                    create: {
                        drugName: m.drugName,
                        manufacturer: m.manufacturer || "",
                        batchNo: m.batchNo,
                        expiryDate: new Date(m.expiryDate),
                        stockQuantity: stockQty,
                        unitPrice: price
                    }
                });
            })
        );

        res.status(201).json({ message: "Bulk upload successful" });
    } catch (error) {
        console.error("Bulk load error", error);
        res.status(500).json({ message: "Server error", error });
    }
};

// Scenario 2: Pharmacist sees pending prescriptions
export const getPrescriptionQueue = async (req: Request, res: Response) => {
    try {
        const prescriptions = await prisma.prescription.findMany({
            where: { status: 'PENDING' },
            include: {
                patient: true,
                visit: { include: { doctor: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch prescription queue', error });
    }
};

// Scenario 2: Dispense medicines for a prescription (atomic)
export const dispensePrescription = async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.body;
        const userId = (req as any).user.id;

        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId },
            include: { visit: true, patient: true }
        });

        if (!prescription || prescription.status === 'DISPENSED') {
            return res.status(400).json({ message: 'Prescription not found or already dispensed' });
        }

        const medicines = prescription.medicines as any[];

        const billResult = await prisma.$transaction(async (tx) => {
            let subTotal = 0;

            for (const med of medicines) {
                const drug = await tx.medicineInventory.findUnique({
                    where: { drugName: med.drugName }
                });
                if (!drug || drug.stockQuantity < 1) {
                    throw new Error(`Insufficient stock for ${med.drugName}`);
                }

                await tx.medicineInventory.update({
                    where: { id: drug.id },
                    data: { stockQuantity: drug.stockQuantity - 1 }
                });

                subTotal += drug.unitPrice;
            }

            // Mark prescription as DISPENSED
            await tx.prescription.update({
                where: { id: prescriptionId },
                data: { status: 'DISPENSED' }
            });

            const gstAmount = subTotal * 0.12;
            const netPayable = subTotal + gstAmount;

            const bill = await tx.bill.create({
                data: {
                    billNo: `BL-PHAR-${Date.now()}`,
                    patientId: prescription.patientId,
                    visitId: prescription.visitId || null,
                    type: 'PHARMACY',
                    subTotal,
                    gstAmount,
                    discount: 0,
                    netPayable,
                    paymentMode: 'CASH',
                    status: 'UNPAID'
                }
            });

            return bill;
        });

        await logAudit(userId, 'PRESCRIPTION_DISPENSED', { prescriptionId }, req.ip || null);
        res.status(201).json({ message: 'Prescription dispensed & billed', bill: billResult });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to dispense prescription', error });
    }
};

// Phase 16: AI Prescription Analysis
export const analyzePrescriptionAI = async (req: Request, res: Response) => {
    try {
        const { medicines } = req.body;
        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ message: 'No medicines provided for analysis' });
        }

        // Simulating LLM Processing Delay
        await new Promise(r => setTimeout(r, 1200));

        // Mock AI Logic based on inputs
        const names = medicines.map((m: any) => m.drugName.toLowerCase());
        const hasAntibiotic = names.some((n: string) => n.includes('amoxicillin') || n.includes('azithromycin') || n.includes('ciprofloxacin'));
        const hasNsaid = names.some((n: string) => n.includes('ibuprofen') || n.includes('naproxen') || n.includes('diclofenac'));
        const hasWarfarin = names.some((n: string) => n.includes('warfarin'));

        const interactions = [];
        if (hasAntibiotic && hasNsaid) {
            interactions.push({
                severity: 'MODERATE',
                description: 'Potential for increased gastrointestinal irritation when antibiotics are used with NSAIDs.',
                recommendation: 'Monitor patient for GI discomfort. Advise taking NSAIDs with food.'
            });
        }
        if (hasWarfarin && hasAntibiotic) {
            interactions.push({
                severity: 'HIGH',
                description: 'Antibiotics can alter intestinal flora, potentially increasing the effects of Warfarin and bleeding risk.',
                recommendation: 'Closely monitor INR values. Adjust Warfarin dosage if necessary.'
            });
        }

        const costSavings = [];
        const brandedParacetamol = medicines.find((m: any) => m.drugName.toLowerCase().includes('tylenol') || m.drugName.toLowerCase() === 'crocin' || m.drugName.toLowerCase() === 'dolo');
        if (brandedParacetamol) {
            costSavings.push({
                original: brandedParacetamol.drugName,
                alternative: 'Generic Paracetamol 500mg',
                savingsEst: '60%'
            });
        }

        let overallRisk = 'LOW';
        if (interactions.length > 0) overallRisk = 'MODERATE';
        if (interactions.some(i => i.severity === 'HIGH')) overallRisk = 'HIGH';
        if (medicines.length > 4 && overallRisk === 'LOW') overallRisk = 'MODERATE'; // Polypharmacy warning

        res.status(200).json({
            status: 'SUCCESS',
            analysis: {
                overallRisk,
                interactions,
                costSavings,
                summary: `AI analyzed ${medicines.length} prescribed medications. Found ${interactions.length} potential interaction(s) and ${costSavings.length} cost-saving alternative(s).`
            }
        });
    } catch (error) {
        console.error("AI Analysis error", error);
        res.status(500).json({ message: 'AI Analysis failed', error });
    }
};

