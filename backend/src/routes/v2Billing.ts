import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';
import { parseClinicalNarrativeICD11 } from '../utils/aiService';

const router = Router();

// ==========================================
// EPIC 1: Clinical Event Ingestion
// ==========================================
router.post('/billing/event', async (req: Request, res: Response) => {
    try {
        const { eventRefUuid, folioId, originModule, eventCode, rawNarrative, timestamp } = req.body;

        if (!eventRefUuid || !folioId) {
            return res.status(400).json({ status: 'ERROR', message: 'Missing eventRefUuid or folioId' });
        }

        // Idempotency check
        const existing = await prisma.billingItem.findUnique({
            where: { eventRefUuid }
        });

        if (existing) {
            return res.status(200).json({
                status: 'SUCCESS',
                billingItemId: existing.id,
                mappedBaseAmount: Number(existing.baseAmount),
                taxComponentGst: Number(existing.taxAmount),
                assignedIcd11Code: existing.icd11Code
            });
        }

        // Parse clinical narrative to extract code and cost
        const aiResult = await parseClinicalNarrativeICD11(rawNarrative || eventCode);

        // Check if folio exists
        const folio = await prisma.patientFolio.findUnique({ where: { id: folioId } });
        if (!folio) {
            return res.status(404).json({ status: 'ERROR', message: 'Patient folio not found' });
        }

        // Create billing item
        const billingItem = await prisma.billingItem.create({
            data: {
                folioId,
                eventRefUuid,
                description: aiResult.procedure,
                baseAmount: aiResult.baseAmount,
                taxAmount: aiResult.taxAmount,
                icd11Code: aiResult.icd11Code,
            }
        });

        return res.status(201).json({
            status: 'SUCCESS',
            billingItemId: billingItem.id,
            mappedBaseAmount: Number(billingItem.baseAmount),
            taxComponentGst: Number(billingItem.taxAmount),
            assignedIcd11Code: billingItem.icd11Code
        });
    } catch (error: any) {
        console.error('Error processing billing event:', error);
        return res.status(500).json({ status: 'ERROR', message: 'Internal server error', error: error.message });
    }
});

// ==========================================
// EPIC 2: TPA Split & Settle Billing
// ==========================================
router.post('/tpa/claim/split', async (req: Request, res: Response) => {
    try {
        const { folioId, tpaId, totalFolioGross, preAuthLimit } = req.body;

        if (!folioId || !tpaId || totalFolioGross === undefined || preAuthLimit === undefined) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const tpaApprovedCoverage = Math.min(totalFolioGross, preAuthLimit);
        const patientCoPayLiability = totalFolioGross - tpaApprovedCoverage;

        // Check if folio exists
        const folio = await prisma.patientFolio.findUnique({ where: { id: folioId } });
        if (!folio) {
            return res.status(404).json({ message: 'Patient folio not found' });
        }

        // Create TPA claim
        await prisma.tpaClaim.create({
            data: {
                folioId,
                tpaName: tpaId,
                preAuthApprovedAmt: tpaApprovedCoverage,
                settledAmount: 0.00,
                status: 'PRE_AUTH'
            }
        });

        return res.status(200).json({
            allocationSummary: {
                patientCoPayLiability,
                corporateAccountsReceivableTpa: tpaApprovedCoverage,
                status: 'SPLIT_PROCESSED'
            }
        });
    } catch (error: any) {
        console.error('Error processing claim split:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.post('/tpa/claim/settle', async (req: Request, res: Response) => {
    try {
        const { claimId, settledAmount } = req.body;

        if (!claimId || settledAmount === undefined) {
            return res.status(400).json({ message: 'claimId and settledAmount are required' });
        }

        const claim = await prisma.tpaClaim.findUnique({ where: { id: claimId } });
        if (!claim) {
            return res.status(404).json({ message: 'TPA Claim not found' });
        }

        const preAuthAmount = Number(claim.preAuthApprovedAmt);
        const delta = preAuthAmount - settledAmount;

        let status: 'SETTLED' | 'RECON_HAIRCUT' = 'SETTLED';

        if (delta > 0) {
            status = 'RECON_HAIRCUT';

            // Route the delta to internal Bad Debt / Disallowed Expense cost center
            const badDebtCostCenter = await prisma.costCenter.upsert({
                where: { id: 'BAD_DEBT_DISALLOWED' },
                update: {},
                create: {
                    id: 'BAD_DEBT_DISALLOWED',
                    name: 'Bad Debt & Disallowed Expenses CC',
                    type: 'ADMIN'
                }
            });

            await prisma.ledger.create({
                data: {
                    name: `TPA Disallowed Rejection Loss - Folio ${claim.folioId.substring(0,8)}`,
                    group: 'Expenses',
                    baseAmount: delta,
                    taxEligibilityStatus: 'EXEMPT',
                    costCenterId: badDebtCostCenter.id,
                    workflowStatus: 'APPROVED',
                    createdByUserId: 'SYSTEM',
                    approvedByUserId: 'SYSTEM'
                }
            });

            // Trigger immediate notification to the audit panel
            await prisma.notification.create({
                data: {
                    targetUserId: (req as any).user?.id || 'EMP-0000-ADMIN',
                    type: 'TPA_HAIRCUT',
                    title: 'TPA Reconciled with Haircut',
                    body: `Claim ${claimId.substring(0,8)} approved for ₹${preAuthAmount} was settled for ₹${settledAmount}. Loss of ₹${delta} routed to BAD_DEBT cost center.`,
                    priority: 'HIGH'
                }
            });
        }

        // Update claim status
        const updatedClaim = await prisma.tpaClaim.update({
            where: { id: claimId },
            data: {
                settledAmount,
                status
            }
        });

        return res.status(200).json({
            message: 'Claim settled successfully',
            claim: updatedClaim,
            haircutAmount: delta > 0 ? delta : 0
        });
    } catch (error: any) {
        console.error('Error settling claim:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

router.get('/tpa/claims', async (req: Request, res: Response) => {
    try {
        const claims = await prisma.tpaClaim.findMany({
            include: { folio: true }
        });
        return res.status(200).json(claims);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
    }
});

// ==========================================
// EPIC 4: FEFO Expiry & Stock Valuations
// ==========================================
router.get('/pharmacy/inventory/batches', async (req: Request, res: Response) => {
    try {
        // Enforce strict selection order (FEFO) - earliest expiring first
        const batches = await prisma.inventoryBatch.findMany({
            orderBy: { expiryDate: 'asc' }
        });
        return res.status(200).json(batches);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to fetch inventory batches', error: error.message });
    }
});

router.post('/pharmacy/inventory/batches', async (req: Request, res: Response) => {
    try {
        const { skuCode, batchNumber, expiryDate, quantity, unitCost } = req.body;
        if (!skuCode || !batchNumber || !expiryDate || quantity === undefined || unitCost === undefined) {
            return res.status(400).json({ message: 'Missing parameters' });
        }

        const batch = await prisma.inventoryBatch.create({
            data: {
                skuCode,
                batchNumber,
                expiryDate: new Date(expiryDate),
                quantity,
                unitCost,
                status: 'ACTIVE'
            }
        });
        return res.status(201).json(batch);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to create inventory batch', error: error.message });
    }
});

router.post('/pharmacy/inventory/check-expiry', async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const preExpiryLimit = new Date();
        preExpiryLimit.setDate(now.getDate() + 90); // 90 days from now

        const batches = await prisma.inventoryBatch.findMany({
            where: {
                status: { in: ['ACTIVE', 'NEAR_EXPIRY'] }
            }
        });

        let updatedNearExpiry = 0;
        let updatedExpired = 0;

        for (const batch of batches) {
            const expDate = new Date(batch.expiryDate);

            if (expDate <= now) {
                // EXPIRED batch - trigger write-off and tax Reversal
                await prisma.inventoryBatch.update({
                    where: { id: batch.id },
                    data: {
                        status: 'EXPIRED',
                        itcReversed: true
                    }
                });

                // Generate ledger write-off entry
                const writeOffCostCenter = await prisma.costCenter.upsert({
                    where: { id: 'PHARMACY_WRITEOFF' },
                    update: {},
                    create: { id: 'PHARMACY_WRITEOFF', name: 'Pharmacy Stock Write-off CC', type: 'PHARMACY' }
                });

                const writeOffAmount = Number(batch.unitCost) * batch.quantity;

                await prisma.ledger.create({
                    data: {
                        name: `Stock Write-off: Expired Batch ${batch.batchNumber}`,
                        group: 'Expenses',
                        baseAmount: writeOffAmount,
                        taxEligibilityStatus: 'PARTIAL_REVERSAL',
                        costCenterId: writeOffCostCenter.id,
                        workflowStatus: 'APPROVED',
                        createdByUserId: 'SYSTEM',
                        approvedByUserId: 'SYSTEM'
                    }
                });

                // Generate a GSTR-1 compliant Debit/Credit Note request conceptually
                await prisma.notification.create({
                    data: {
                        targetUserId: (req as any).user?.id || 'EMP-0000-ADMIN',
                        type: 'TAX_REVERSAL',
                        title: `GSTR-1 Reversal: Batch ${batch.batchNumber}`,
                        body: `Expired inventory batch ${batch.batchNumber} (SKU: ${batch.skuCode}, Value: ₹${writeOffAmount.toFixed(2)}) has been written off. Input Tax Credit (ITC) reversal request generated under CGST Sec 17(5)(h).`,
                        priority: 'HIGH'
                    }
                });

                updatedExpired++;
            } else if (expDate <= preExpiryLimit) {
                // NEAR EXPIRY batch
                await prisma.inventoryBatch.update({
                    where: { id: batch.id },
                    data: { status: 'NEAR_EXPIRY' }
                });

                // High priority flag to procurement dashboard via notification
                await prisma.notification.create({
                    data: {
                        targetUserId: (req as any).user?.id || 'EMP-0000-ADMIN',
                        type: 'INVENTORY_ALERT',
                        title: `BATCH EXPIRING SOON: ${batch.batchNumber}`,
                        body: `Batch ${batch.batchNumber} (SKU: ${batch.skuCode}, Qty: ${batch.quantity}) expires on ${expDate.toLocaleDateString()}. Please initiate vendor returns or markdown distributions.`,
                        priority: 'HIGH'
                    }
                });

                updatedNearExpiry++;
            }
        }

        return res.status(200).json({
            message: 'Expiry check completed',
            summary: {
                flaggedNearExpiry: updatedNearExpiry,
                writtenOffExpired: updatedExpired
            }
        });
    } catch (error: any) {
        console.error('Error running expiry check:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// ==========================================
// EPIC 5: AI ICD-11 Narrative Parsing
// ==========================================
router.post('/ai/icd11/parse', async (req: Request, res: Response) => {
    try {
        const { rawNarrative } = req.body;
        if (!rawNarrative) {
            return res.status(400).json({ message: 'rawNarrative is required' });
        }

        const parseResult = await parseClinicalNarrativeICD11(rawNarrative);
        return res.status(200).json(parseResult);
    } catch (error: any) {
        return res.status(500).json({ message: 'AI parsing failed', error: error.message });
    }
});

// ==========================================
// GENERAL: Patient Folio Seed Handlers
// ==========================================
router.get('/patient/folios', async (req: Request, res: Response) => {
    try {
        const folios = await prisma.patientFolio.findMany({
            include: { billingItems: true, tpaClaims: true }
        });
        return res.status(200).json(folios);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to fetch folios', error: error.message });
    }
});

router.post('/patient/folios', async (req: Request, res: Response) => {
    try {
        const { patientName, abhaId } = req.body;
        if (!patientName) {
            return res.status(400).json({ message: 'patientName is required' });
        }

        const folio = await prisma.patientFolio.create({
            data: {
                patientName,
                abhaId: abhaId || null,
                isActive: true
            }
        });
        return res.status(201).json(folio);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to create folio', error: error.message });
    }
});

export default router;
