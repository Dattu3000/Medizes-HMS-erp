import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db';

const router = Router();

// SLA Escalation Background Runner
// Scans for alerts still in 'FIRED' state that have crossed the 180s threshold
setInterval(async () => {
    try {
        const thresholdDate = new Date(Date.now() - 180 * 1000); // 180 seconds ago
        const pendingAlerts = await prisma.panicAlert.findMany({
            where: {
                alertStatus: 'FIRED',
                alertFiredAt: { lte: thresholdDate }
            }
        });

        for (const alert of pendingAlerts) {
            await prisma.panicAlert.update({
                where: { id: alert.id },
                data: {
                    alertStatus: 'ESCALATED',
                    escalationFiredAt: new Date()
                }
            });

            // Log liability risk entry in notifications / audit logs
            await prisma.notification.create({
                data: {
                    targetUserId: 'EMP-0000-ADMIN', // CMS ID
                    type: 'LIABILITY_ESCALATION',
                    title: 'CRITICAL OVERRIDE SLA ESCALATION',
                    body: `Panic Alert ${alert.id.substring(0,8)} for doctor ${alert.notifiedDoctorId} has breached the 180s response SLA without physician acknowledgment. Escalated to Chief Medical Superintendent.`,
                    priority: 'CRITICAL'
                }
            });

            // Write a structural liability audit entry
            await prisma.financialAuditLog.create({
                data: {
                    tableName: 'PanicAlert',
                    recordId: alert.id,
                    action: 'UPDATE_SLA_BREACH',
                    oldSnapshot: JSON.stringify(alert),
                    newSnapshot: JSON.stringify({ status: 'ESCALATED', escalatedAt: new Date() }),
                    changedByUserId: 'SYSTEM_CRON',
                    details: 'Physician override acknowledgment SLA breach (180s exceeded).'
                }
            });
        }
    } catch (err) {
        console.error('Error in SLA escalation cron:', err);
    }
}, 10000); // Run every 10 seconds

// ==========================================
// EPIC 1: OP Queue & E-Prescriptions
// ==========================================

// Get queue wait-time matrix
router.get('/clinical/op-queue', async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.query;

        const whereClause = doctorId ? { doctorId: String(doctorId) } : {};
        const queueItems = await prisma.opQueue.findMany({
            where: whereClause,
            orderBy: { tokenNumber: 'asc' }
        });

        // Dynamic waiting-time estimation matrix calculation
        // W_projected = sum_{i=1}^{n} (T_baseline * C_triage) + W_buffer
        const T_baseline = 15; // baseline: 15 mins per patient
        const allQueue = await prisma.opQueue.findMany();
        const W_buffer = allQueue.length >= 10 ? 5 : 2; // congestion index

        let runningSum = 0;
        const projectedQueue = queueItems.map((item, idx) => {
            const C_triage = item.triageScore >= 4 ? 1.8 : 1.0;
            runningSum += (T_baseline * C_triage);
            const waitTime = runningSum + W_buffer;

            let state: 'ON_TIME' | 'LAGGING' | 'CRITICAL_DELAY' = 'ON_TIME';
            if (waitTime > 60) {
                state = 'CRITICAL_DELAY';
            } else if (waitTime > 30) {
                state = 'LAGGING';
            }

            return {
                ...item,
                projectedWaitMin: waitTime,
                velocityState: state
            };
        });

        return res.status(200).json(projectedQueue);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to fetch OP Queue', error: error.message });
    }
});

// Onboard / Add to OP Queue
router.post('/clinical/op-queue', async (req: Request, res: Response) => {
    try {
        const { doctorId, patientFolioId, triageScore } = req.body;

        if (!doctorId || !patientFolioId) {
            return res.status(400).json({ message: 'Missing doctorId or patientFolioId' });
        }

        // Get max token number
        const lastItem = await prisma.opQueue.findFirst({
            where: { doctorId },
            orderBy: { tokenNumber: 'desc' }
        });
        const tokenNumber = lastItem ? lastItem.tokenNumber + 1 : 1;

        const opQueueItem = await prisma.opQueue.create({
            data: {
                doctorId,
                patientFolioId,
                tokenNumber,
                triageScore: triageScore ? parseInt(triageScore) : 1,
                projectedWaitMin: 0,
                velocityState: 'ON_TIME'
            }
        });

        return res.status(201).json(opQueueItem);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to add to queue', error: error.message });
    }
});

// Signoff & Point-of-Care Billing webhook
router.post('/clinical/op-signoff', async (req: Request, res: Response) => {
    try {
        const { opQueueId, folioId, items } = req.body; // items = Array of { description, amount }

        if (!folioId) {
            return res.status(400).json({ message: 'folioId is required' });
        }

        // Remove from queue if opQueueId provided
        if (opQueueId) {
            await prisma.opQueue.delete({ where: { id: opQueueId } });
        }

        // Calculate billing totals mapped for GST taxes (5%)
        const totalBase = items.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
        const totalTax = totalBase * 0.05;
        const totalGross = totalBase + totalTax;

        // Generate dynamic Short Link
        const shortLinkId = `tx_${Math.random().toString(36).substring(2, 8)}`;
        const shortLink = `https://medisys.hms/pay/${shortLinkId}`;

        // Create billing items on patient folio
        for (const item of items) {
            await prisma.billingItem.create({
                data: {
                    folioId,
                    description: item.description,
                    baseAmount: Number(item.amount),
                    taxAmount: Number(item.amount) * 0.05,
                    isReconciled: false
                }
            });
        }

        // Return payment parameters & webhook mock logging
        return res.status(200).json({
            status: 'SUCCESS',
            billingSummary: {
                baseAmount: totalBase,
                taxAmount: totalTax,
                grossAmount: totalGross
            },
            paymentShortLink: shortLink,
            webhookLogs: {
                smsDispatch: `Payment request sent to patient's verified mobile number: "Dear Patient, please pay ₹${totalGross.toFixed(2)} at ${shortLink}."`,
                whatsappDispatch: `WhatsApp messaging dispatch complete: TxRef: ${shortLinkId}.`
            }
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Signoff billing creation failed', error: error.message });
    }
});

// Autocomplete lookup for E-Prescriptions
router.get('/pharmacy/drugs/autocomplete', async (req: Request, res: Response) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Query parameter is required' });
        }

        // Match generic names in MedicineInventory
        const matchedMedicines = await prisma.medicineInventory.findMany({
            where: {
                drugName: { contains: String(query), mode: 'insensitive' }
            }
        });

        if (matchedMedicines.length === 0) {
            // Out of stock alternative suggestions
            const alternatives: Record<string, string[]> = {
                'amoxicillin': ['Azithromycin 500mg', 'Cefuroxime 250mg', 'Clarithromycin 500mg'],
                'paracetamol': ['Ibuprofen 400mg', 'Aceclofenac 100mg'],
                'metformin': ['Glimepiride 2mg', 'Sitagliptin 100mg'],
                'atorvastatin': ['Rosuvastatin 10mg', 'Simvastatin 20mg']
            };
            const lowerQuery = String(query).toLowerCase();
            const alternativeList = alternatives[lowerQuery] || ['Aspirin 75mg', 'Levofloxacin 500mg'];

            return res.status(200).json({
                drugName: query,
                outOfStock: true,
                alternatives: alternativeList,
                batches: []
            });
        }

        // Rank available stock batches
        const matchedBatches = await prisma.inventoryBatch.findMany({
            where: {
                skuCode: { contains: String(query), mode: 'insensitive' },
                status: { in: ['ACTIVE', 'NEAR_EXPIRY'] }
            }
        });

        const sortedBatches = matchedBatches.sort((a, b) => {
            const now = new Date();
            const expA = new Date(a.expiryDate);
            const expB = new Date(b.expiryDate);

            const daysToExpiryA = (expA.getTime() - now.getTime()) / (1000 * 3600 * 24);
            const daysToExpiryB = (expB.getTime() - now.getTime()) / (1000 * 3600 * 24);

            const isNearExpiryA = daysToExpiryA <= 90;
            const isNearExpiryB = daysToExpiryB <= 90;

            const isDeadweightA = a.quantity >= 500;
            const isDeadweightB = b.quantity >= 500;

            // Priority score calculation: near-expiry has highest boost (+3), deadweight next (+1)
            let scoreA = 0;
            if (isNearExpiryA) scoreA += 3;
            if (isDeadweightA) scoreA += 1;

            let scoreB = 0;
            if (isNearExpiryB) scoreB += 3;
            if (isDeadweightB) scoreB += 1;

            return scoreB - scoreA || daysToExpiryA - daysToExpiryB; // Higher score first, then earliest expiry
        });

        const totalStock = sortedBatches.reduce((sum, b) => sum + b.quantity, 0);

        if (totalStock === 0) {
            // Completely out of stock alternative suggestions
            const alternatives: Record<string, string[]> = {
                'amoxicillin': ['Azithromycin 500mg', 'Cefuroxime 250mg', 'Clarithromycin 500mg'],
                'paracetamol': ['Ibuprofen 400mg', 'Aceclofenac 100mg'],
                'metformin': ['Glimepiride 2mg', 'Sitagliptin 100mg'],
                'atorvastatin': ['Rosuvastatin 10mg', 'Simvastatin 20mg']
            };
            const lowerQuery = String(query).toLowerCase();
            const alternativeList = alternatives[lowerQuery] || ['Aspirin 75mg', 'Levofloxacin 500mg'];

            return res.status(200).json({
                drugName: query,
                outOfStock: true,
                alternatives: alternativeList,
                batches: []
            });
        }

        return res.status(200).json({
            drugName: query,
            outOfStock: false,
            alternatives: [],
            batches: sortedBatches.map(b => {
                const daysToExpiry = (new Date(b.expiryDate).getTime() - Date.now()) / (1000 * 3600 * 24);
                return {
                    id: b.id,
                    batchNumber: b.batchNumber,
                    expiryDate: b.expiryDate,
                    quantity: b.quantity,
                    unitCost: Number(b.unitCost),
                    isNearExpiry: daysToExpiry <= 90,
                    isDeadweight: b.quantity >= 500
                };
            })
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Autocomplete lookup failed', error: error.message });
    }
});


// ==========================================
// EPIC 2: Biomarkers & Critical Panic Lab Hub
// ==========================================

// Fetch Biomarker Historical Velocity Data
router.get('/diagnostics/biomarker/velocity', async (req: Request, res: Response) => {
    try {
        const { patientFolioId, testCode, lookbackMonths } = req.query;

        if (!patientFolioId || !testCode) {
            return res.status(400).json({ message: 'patientFolioId and testCode are required' });
        }

        const months = lookbackMonths ? parseInt(String(lookbackMonths)) : 24;
        const lookbackDate = new Date();
        lookbackDate.setMonth(lookbackDate.getMonth() - months);

        const results = await prisma.labPanelResult.findMany({
            where: {
                patientFolioId: String(patientFolioId),
                testCode: String(testCode),
                createdAt: { gte: lookbackDate }
            },
            orderBy: { createdAt: 'asc' }
        });

        if (results.length === 0) {
            return res.status(200).json({
                patientFolioId,
                testCode,
                biomarker: String(testCode).replace(/_/g, ' '),
                velocityTrend: 'STABLE',
                datapoints: [],
                calculatedDeltaVelocity: 0.00
            });
        }

        // Calculate delta velocity
        // Delta V = (C_current - C_previous) / (t_current - t_previous)
        let calculatedDeltaVelocity = 0;
        if (results.length > 1) {
            const current = results[results.length - 1];
            const previous = results[results.length - 2];

            const cDiff = Number(current.quantitativeValue) - Number(previous.quantitativeValue);
            // Difference in days
            const tDiff = (new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime()) / (1000 * 3600 * 24);

            if (tDiff > 0) {
                calculatedDeltaVelocity = cDiff / tDiff;
            }
        }

        let trend: 'STABLE' | 'ACCELERATING_UPWARD' | 'ACCELERATING_DOWNWARD' = 'STABLE';
        if (calculatedDeltaVelocity > 0.01) {
            trend = 'ACCELERATING_UPWARD';
        } else if (calculatedDeltaVelocity < -0.01) {
            trend = 'ACCELERATING_DOWNWARD';
        }

        return res.status(200).json({
            patientFolioId,
            testCode,
            biomarker: results[0].biomarkerName,
            velocityTrend: trend,
            datapoints: results.map(r => ({
                timestamp: r.createdAt.toISOString(),
                value: Number(r.quantitativeValue)
            })),
            calculatedDeltaVelocity
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to compute biomarker velocity', error: error.message });
    }
});

// Acknowledge Panic Alert
router.post('/clinical/panic/acknowledge', async (req: Request, res: Response) => {
    try {
        const { panicAlertId, reviewerDoctorId, clinicalActionTaken } = req.body;

        if (!panicAlertId || !reviewerDoctorId) {
            return res.status(400).json({ message: 'panicAlertId and reviewerDoctorId are required' });
        }

        const alert = await prisma.panicAlert.findUnique({
            where: { id: panicAlertId }
        });

        if (!alert) {
            return res.status(404).json({ message: 'Panic alert not found' });
        }

        const now = new Date();
        const durationMs = now.getTime() - new Date(alert.alertFiredAt).getTime();
        const seconds = Math.floor(durationMs / 1000);

        const updatedAlert = await prisma.panicAlert.update({
            where: { id: panicAlertId },
            data: {
                alertStatus: 'ACKNOWLEDGED',
                acknowledgedAt: now,
                deltaDurationMs: durationMs
            }
        });

        // Audit Logging
        await prisma.financialAuditLog.create({
            data: {
                tableName: 'PanicAlert',
                recordId: panicAlertId,
                action: 'ACKNOWLEDGE',
                oldSnapshot: JSON.stringify(alert),
                newSnapshot: JSON.stringify(updatedAlert),
                changedByUserId: reviewerDoctorId,
                details: `Panic alert acknowledged in ${seconds}s. Action Taken: ${clinicalActionTaken || 'None specified'}.`
            }
        });

        const withinSLA = seconds <= 180;

        return res.status(200).json({
            status: 'SUCCESS',
            panicAlertId,
            complianceState: withinSLA ? 'CLOSED_WITHIN_SLA' : 'CLOSED_SLA_BREACHED',
            latencySeconds: seconds
        });
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to acknowledge alert', error: error.message });
    }
});

// Fetch active panic alert for a doctor (Stream/SSE/Poll target endpoint)
router.get('/clinical/panic/active', async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.query;

        if (!doctorId) {
            return res.status(400).json({ message: 'doctorId is required' });
        }

        const activeAlert = await prisma.panicAlert.findFirst({
            where: {
                notifiedDoctorId: String(doctorId),
                alertStatus: 'FIRED'
            },
            include: { labPanelResult: true }
        });

        return res.status(200).json(activeAlert);
    } catch (error: any) {
        return res.status(500).json({ message: 'Failed to fetch active alerts', error: error.message });
    }
});

// Server-Sent Events (SSE) Stream Endpoint for instant alerts
router.get('/clinical/panic/stream', async (req: Request, res: Response) => {
    const { doctorId } = req.query;
    if (!doctorId) {
        return res.status(400).json({ message: 'doctorId is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const interval = setInterval(async () => {
        try {
            const activeAlert = await prisma.panicAlert.findFirst({
                where: {
                    notifiedDoctorId: String(doctorId),
                    alertStatus: 'FIRED'
                },
                include: { labPanelResult: true }
            });
            if (activeAlert) {
                res.write(`data: ${JSON.stringify(activeAlert)}\n\n`);
            } else {
                res.write(`data: null\n\n`);
            }
        } catch (e) {
            // handle error
        }
    }, 2000);

    req.on('close', () => {
        clearInterval(interval);
    });
});

// Release Analyzer Lab Test Run & Consumable Inventory Markdown + Costing
router.post('/clinical/lab/results', async (req: Request, res: Response) => {
    try {
        const { patientFolioId, testCode, biomarkerName, value, unit, doctorId } = req.body;

        if (!patientFolioId || !testCode || value === undefined || !doctorId) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        const quantitativeValue = Number(value);

        // Check if value is panic
        // Potassium (K_SERUM) >= 6.5, Hemoglobin (HB_BLOOD) <= 5.0, or Trop-I (TROP_I) >= 0.5
        let isAbsolutePanic = false;
        if (testCode === 'K_SERUM' && quantitativeValue >= 6.5) {
            isAbsolutePanic = true;
        } else if (testCode === 'HB_BLOOD' && quantitativeValue <= 5.0) {
            isAbsolutePanic = true;
        } else if (testCode === 'TROP_I' && quantitativeValue >= 0.5) {
            isAbsolutePanic = true;
        }

        // 1. Save Lab Result
        const result = await prisma.labPanelResult.create({
            data: {
                patientFolioId,
                testCode,
                biomarkerName,
                quantitativeValue,
                unitOfMeasure: unit || 'mmol/L',
                isAbsolutePanic
            }
        });

        // 2. Create PanicAlert if panic
        let panicAlert = null;
        if (isAbsolutePanic) {
            panicAlert = await prisma.panicAlert.create({
                data: {
                    labPanelResultId: result.id,
                    notifiedDoctorId: doctorId,
                    alertStatus: 'FIRED'
                }
            });
        }

        // 3. Consumable-Linked Costing Markdown
        // Deduct 1 unit of slide & reagent from inventory batches
        const reagentBatch = await prisma.inventoryBatch.findFirst({
            where: {
                skuCode: { contains: 'reagent', mode: 'insensitive' },
                quantity: { gt: 0 }
            }
        });
        const slideBatch = await prisma.inventoryBatch.findFirst({
            where: {
                skuCode: { contains: 'slide', mode: 'insensitive' },
                quantity: { gt: 0 }
            }
        });

        let totalMarkdownCost = 0.00;

        if (reagentBatch) {
            await prisma.inventoryBatch.update({
                where: { id: reagentBatch.id },
                data: { quantity: { decrement: 1 } }
            });
            totalMarkdownCost += Number(reagentBatch.unitCost);
        } else {
            // Mock markdown cost if batch doesn't exist
            totalMarkdownCost += 150.00;
        }

        if (slideBatch) {
            await prisma.inventoryBatch.update({
                where: { id: slideBatch.id },
                data: { quantity: { decrement: 1 } }
            });
            totalMarkdownCost += Number(slideBatch.unitCost);
        } else {
            totalMarkdownCost += 50.00;
        }

        // 4. Ledger cost posting against Laboratory Cost Center
        const labCostCenter = await prisma.costCenter.upsert({
            where: { id: 'LABORATORY_CC' },
            update: {},
            create: {
                id: 'LABORATORY_CC',
                name: 'Core Laboratory Department CC',
                type: 'ADMIN'
            }
        });

        await prisma.ledger.create({
            data: {
                name: `Reagents/Slides Markdown - Result ID ${result.id.substring(0,8)}`,
                group: 'Expenses',
                baseAmount: totalMarkdownCost,
                taxEligibilityStatus: 'EXEMPT',
                costCenterId: labCostCenter.id,
                workflowStatus: 'APPROVED',
                createdByUserId: 'SYSTEM',
                approvedByUserId: 'SYSTEM'
            }
        });

        return res.status(201).json({
            status: 'SUCCESS',
            result,
            panicAlert,
            consumablesMarkdown: {
                reagentDeducted: !!reagentBatch,
                slideDeducted: !!slideBatch,
                postedCostToGL: totalMarkdownCost
            }
        });
    } catch (error: any) {
        console.error('Error releasing lab results:', error);
        return res.status(500).json({ message: 'Result release failed', error: error.message });
    }
});

export default router;
