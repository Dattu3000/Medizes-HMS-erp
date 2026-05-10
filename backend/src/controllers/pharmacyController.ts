import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { callGemma } from '../utils/aiService';
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

                const updatedDrug = await tx.medicineInventory.update({
                    where: { id: drug.id },
                    data: { stockQuantity: drug.stockQuantity - item.quantity }
                });

                if (updatedDrug.stockQuantity <= updatedDrug.lowStockThreshold) {
                    const admins = await tx.user.findMany({ where: { role: { name: 'Admin' } } });
                    for (const admin of admins) {
                        await tx.notification.create({
                            data: {
                                targetUserId: admin.id,
                                type: 'INVENTORY_ALERT',
                                title: `LOW STOCK: ${updatedDrug.drugName}`,
                                body: `Stock is at ${updatedDrug.stockQuantity} (Threshold: ${updatedDrug.lowStockThreshold}). Restock required. Auto-PO generated.`,
                            }
                        });
                    }

                    const reorderQty = updatedDrug.lowStockThreshold * 2;
                    const reorderAmount = updatedDrug.unitPrice * reorderQty;
                    
                    await tx.accountsPayable.create({
                        data: {
                            vendorName: updatedDrug.manufacturer || 'Auto-Vendor',
                            amount: reorderAmount,
                            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            status: 'OUTSTANDING'
                        }
                    });
                    
                    await tx.expense.create({
                        data: {
                            voucherNo: `PO-${Date.now()}-${updatedDrug.id.substring(0, 4)}`,
                            category: 'Inventory Restock',
                            description: `Auto-PO for ${updatedDrug.drugName} (Qty: ${reorderQty})`,
                            amount: reorderAmount,
                            netAmount: reorderAmount,
                            paymentMode: 'CREDIT',
                            status: 'PENDING'
                        }
                    });
                }

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
            
            include: {
                patient: true,
                visit: { include: { doctor: true } }
            },
            orderBy: { createdAt: 'desc' }, take: 50
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

                const updatedDrug = await tx.medicineInventory.update({
                    where: { id: drug.id },
                    data: { stockQuantity: drug.stockQuantity - 1 }
                });

                if (updatedDrug.stockQuantity <= updatedDrug.lowStockThreshold) {
                    const admins = await tx.user.findMany({ where: { role: { name: 'Admin' } } });
                    for (const admin of admins) {
                        await tx.notification.create({
                            data: {
                                targetUserId: admin.id,
                                type: 'INVENTORY_ALERT',
                                title: `LOW STOCK: ${updatedDrug.drugName}`,
                                body: `Stock is at ${updatedDrug.stockQuantity} (Threshold: ${updatedDrug.lowStockThreshold}). Restock required. Auto-PO generated.`,
                            }
                        });
                    }

                    const reorderQty = updatedDrug.lowStockThreshold * 2;
                    const reorderAmount = updatedDrug.unitPrice * reorderQty;
                    
                    await tx.accountsPayable.create({
                        data: {
                            vendorName: updatedDrug.manufacturer || 'Auto-Vendor',
                            amount: reorderAmount,
                            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            status: 'OUTSTANDING'
                        }
                    });
                    
                    await tx.expense.create({
                        data: {
                            voucherNo: `PO-${Date.now()}-${updatedDrug.id.substring(0, 4)}`,
                            category: 'Inventory Restock',
                            description: `Auto-PO for ${updatedDrug.drugName} (Qty: ${reorderQty})`,
                            amount: reorderAmount,
                            netAmount: reorderAmount,
                            paymentMode: 'CREDIT',
                            status: 'PENDING'
                        }
                    });
                }

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

        const prompt = `You are an AI Clinical Pharmacist. Analyze the following prescribed medications for potential drug interactions and cost-saving generic alternatives.
        Return ONLY a valid JSON object matching this exact shape: 
        {
          "overallRisk": "LOW" | "MODERATE" | "HIGH",
          "summary": "String summarizing findings",
          "interactions": [{"severity": "HIGH" | "MODERATE" | "LOW", "description": "string", "recommendation": "string"}],
          "costSavings": [{"original": "Brand name", "alternative": "Generic name", "savingsEst": "string percentage"}]
        }
        Do NOT wrap the JSON in Markdown formatting like \`\`\`json. Return pure JSON object only.
        
        Prescribed Medicines Payload:
        ${JSON.stringify(medicines)}`;

        const analysis = await callGemma(prompt);

        res.status(200).json({
            status: 'SUCCESS',
            analysis
        });
    } catch (error) {
        console.error("AI Analysis error", error);
        res.status(500).json({ message: 'AI Analysis failed', error });
    }
};

// Automated Expiry Tracking
export const getExpiryAlerts = async (req: Request, res: Response) => {
    try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const alerts = await prisma.medicineInventory.findMany({
            where: {
                expiryDate: {
                    lte: thirtyDaysFromNow,
                    gte: new Date() // within next 30 days
                }
            },
            orderBy: { expiryDate: 'asc' }
        });

        // Also fetch already expired
        const expired = await prisma.medicineInventory.findMany({
            where: { expiryDate: { lt: new Date() } },
            orderBy: { expiryDate: 'desc' }
        });

        res.status(200).json({ expiringSoon: alerts, expired });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch expiry alerts', error });
    }
};

// Undo Dispense
export const undoDispensePrescription = async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.body;
        const userId = (req as any).user.id;

        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId }
        });

        if (!prescription || prescription.status !== 'DISPENSED') {
            return res.status(400).json({ message: 'Prescription not found or not dispensed' });
        }

        const medicines = prescription.medicines as any[];

        await prisma.$transaction(async (tx) => {
            // Restore stock
            for (const med of medicines) {
                const drug = await tx.medicineInventory.findUnique({
                    where: { drugName: med.drugName }
                });
                if (drug) {
                    await tx.medicineInventory.update({
                        where: { id: drug.id },
                        data: { stockQuantity: drug.stockQuantity + 1 }
                    });
                }
            }

            // Set to pending
            await tx.prescription.update({
                where: { id: prescriptionId },
                data: { status: 'PENDING' }
            });

            // Delete unpaid bill if it exists
            await tx.bill.deleteMany({
                where: { visitId: prescription.visitId, type: 'PHARMACY', status: 'UNPAID' }
            });
        });

        res.status(200).json({ message: 'Dispense undone successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to undo dispense', error });
    }
};
