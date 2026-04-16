import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

export const getPatientPendingBills = async (req: Request, res: Response) => {
    try {
        const { uhid } = req.params;
        const patient = await prisma.patient.findUnique({
            where: { uhid: uhid as string }
        });

        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const bills = await prisma.bill.findMany({
            where: {
                patientId: patient.id,
                status: 'UNPAID'
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ patient, bills });
    } catch (error) {
        console.error("Billing fetch error", error);
        res.status(500).json({ message: "Server Error", error });
    }
}

export const processPayment = async (req: Request, res: Response) => {
    try {
        const { patientId, billIds, paymentMode, discount } = req.body;
        const userId = (req as any).user?.id;

        if (!billIds || billIds.length === 0) {
            return res.status(400).json({ message: "No bills selected" });
        }

        // Fetch bills to verify
        const bills = await prisma.bill.findMany({
            where: { id: { in: billIds }, status: 'UNPAID' }
        });

        if (bills.length === 0) {
            return res.status(400).json({ message: "Selected bills are either already paid or invalid." });
        }

        let totalSubTotal = 0;
        let totalGst = 0;

        bills.forEach(b => {
            totalSubTotal += b.subTotal;
            totalGst += b.gstAmount;
        });

        const totalDiscount = Number(discount) || 0;
        const finalNetPayable = (totalSubTotal + totalGst) - totalDiscount;

        await prisma.$transaction(async (tx) => {
            // We could update each individual bill with a slice of the discount or just generally
            // Let's just update all selected bills to 'PAID'
            await tx.bill.updateMany({
                where: { id: { in: billIds } },
                data: {
                    status: 'PAID',
                    paymentMode: paymentMode || 'CASH'
                }
            });

            // If we have an overall discount, maybe update one of the bills or an overarching transaction 
            // Currently, the schema has `discount` per bill. For simplicity, we can apply discount to the first bill
            if (totalDiscount > 0) {
                const firstBill = bills[0];
                await tx.bill.update({
                    where: { id: firstBill.id },
                    data: {
                        discount: firstBill.discount + totalDiscount,
                        netPayable: firstBill.netPayable - totalDiscount
                    }
                });
            }

            // Sync with Accounts Ledger -> Increase Cash/Bank Balance and Revenue
            // 1. Get or create Bank A/c
            const cashLedger = await tx.ledger.upsert({
                where: { name: 'Cash A/c' },
                update: { balance: { increment: Math.max(finalNetPayable, 0) } },
                create: { name: 'Cash A/c', group: 'ASSET', balance: Math.max(finalNetPayable, 0) }
            });

            // 2. Create the Ledger Transaction
            if (finalNetPayable > 0) {
                await tx.transaction.create({
                    data: {
                        ledgerId: cashLedger.id,
                        type: 'CREDIT',
                        amount: finalNetPayable,
                        description: `Bulk payment settlement for ${bills.length} bill(s)`,
                        referenceId: bills[0].id,
                        referenceType: 'BILL'
                    }
                });
            }
        });

        if (userId) {
            await logAudit(userId, 'BILLS_PAID', { count: bills.length, finalNetPayable, paymentMode }, req.ip || null);
        }

        res.status(200).json({ message: "Payment processed successfully", amountPaid: Math.max(finalNetPayable, 0) });
    } catch (error) {
        console.error("Payment error", error);
        res.status(500).json({ message: "Server error", error });
    }
}

// Scenario 1: Aggregate all bills for a visit into a single invoice summary
export const getVisitInvoice = async (req: Request, res: Response) => {
    try {
        const { visitId } = req.params;

        const visit = await prisma.visit.findUnique({
            where: { id: String(visitId) },
            include: { patient: true, doctor: true }
        });

        if (!visit) return res.status(404).json({ message: "Visit not found" });

        const bills = await prisma.bill.findMany({
            where: { visitId: String(visitId) },
            orderBy: { createdAt: 'asc' }
        });

        const summary = {
            visit,
            bills,
            totalSubTotal: bills.reduce((s, b) => s + b.subTotal, 0),
            totalGst: bills.reduce((s, b) => s + b.gstAmount, 0),
            totalDiscount: bills.reduce((s, b) => s + b.discount, 0),
            netPayable: bills.reduce((s, b) => s + b.netPayable, 0),
            paidAmount: bills.filter(b => b.status === 'PAID').reduce((s, b) => s + b.netPayable, 0),
            pendingAmount: bills.filter(b => b.status === 'UNPAID').reduce((s, b) => s + b.netPayable, 0)
        };

        res.status(200).json(summary);
    } catch (error) {
        res.status(500).json({ message: "Failed to generate visit invoice", error });
    }
}
