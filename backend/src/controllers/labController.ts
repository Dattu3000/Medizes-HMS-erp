import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { callGemma } from '../utils/aiService';
import { logAudit } from '../utils/audit';

export const getCatalog = async (req: Request, res: Response) => {
    try {
        const catalog = await prisma.labCatalog.findMany();
        res.status(200).json(catalog);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch lab catalog', error });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.labOrder.findMany({
            include: {
                patient: true,
                visit: { include: { doctor: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch lab orders', error });
    }
};

export const orderTest = async (req: Request, res: Response) => {
    try {
        const { patientId, visitId, testId } = req.body;
        const userId = (req as any).user.id;

        // Fetch the test from catalog
        const testInfo = await prisma.labCatalog.findUnique({
            where: { id: testId }
        });

        if (!testInfo) return res.status(404).json({ message: 'Test not found in catalog' });

        const order = await prisma.$transaction(async (tx) => {
            // 1. Create the lab order
            const newOrder = await tx.labOrder.create({
                data: {
                    patientId,
                    visitId: visitId || null,
                    testName: testInfo.testName,
                    price: testInfo.price,
                    status: 'PENDING',
                    barcode: `BAR-${Date.now().toString().slice(-6)}`,
                    sampleStatus: 'PENDING'
                }
            });

            // 2. Auto-generate the bill for the test
            const gstAmount = testInfo.price * 0.18; // 18% GST (SAC: 999316)
            const netPayable = testInfo.price + gstAmount;

            await tx.bill.create({
                data: {
                    billNo: `BL-LAB-${Date.now()}`,
                    patientId,
                    visitId: visitId || null,
                    type: 'LAB_DIAGNOSTICS',
                    subTotal: testInfo.price,
                    gstAmount,
                    discount: 0,
                    netPayable,
                    paymentMode: 'CASH',
                    status: 'UNPAID'
                }
            });

            return newOrder;
        });

        await logAudit(userId, 'LAB_ORDER_PLACED', { orderId: order.id, test: testInfo.testName }, req.ip || null);
        res.status(201).json({ message: 'Lab Test Ordered & Billed', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to order lab test', error });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, resultText, resultValue, resultsPayload } = req.body;
        const userId = (req as any).user.id;

        const order = await prisma.labOrder.update({
            where: { id: String(id) },
            data: {
                status,
                ...(resultText && { resultText }),
                ...(resultValue !== undefined && { resultValue: Number(resultValue) }),
                ...(resultsPayload && { resultsPayload })
            },
            include: {
                visit: { include: { doctor: { include: { user: true } } } },
                patient: true
            }
        });

        // Scenario 4: Critical Value Detection
        if (status === 'RESULT_ENTERED') {
            let hasCritical = false;
            let criticalMessage = '';

            if (resultsPayload && Array.isArray(resultsPayload)) {
                // Multi-parameter detection
                const criticals = resultsPayload.filter(r => r.isAbnormal);
                if (criticals.length > 0) {
                    hasCritical = true;
                    criticalMessage = `Critical abnormalities found in parameters: ${criticals.map(c => c.parameter).join(', ')}`;
                }
            } else if (resultValue !== undefined) {
                // Legacy Single Parameter
                const catalogEntry = await prisma.labCatalog.findUnique({
                    where: { testName: order.testName }
                });

                if (catalogEntry && (catalogEntry.criticalMin !== null || catalogEntry.criticalMax !== null)) {
                    const val = Number(resultValue);
                    hasCritical =
                        (catalogEntry.criticalMin !== null && val < catalogEntry.criticalMin) ||
                        (catalogEntry.criticalMax !== null && val > catalogEntry.criticalMax);

                    if (hasCritical) {
                        criticalMessage = `Value: ${val} ${catalogEntry.unit || ''} (Range: ${catalogEntry.criticalMin ?? '—'}–${catalogEntry.criticalMax ?? '—'})`;
                    }
                }
            }

            if (hasCritical && order.visit?.doctor?.user) {
                // Create CRITICAL notification for the doctor
                await prisma.notification.create({
                    data: {
                        targetUserId: order.visit.doctor.user.id,
                        type: 'CRITICAL_ALERT',
                        title: `⚠️ CRITICAL: ${order.testName}`,
                        body: `Patient ${order.patient.firstName} ${order.patient.lastName} (${order.patient.uhid}) — ${criticalMessage}`,
                        priority: 'CRITICAL',
                        visitId: order.visitId,
                        labOrderId: order.id
                    }
                });
            }

            // normal notification
            if (order.visit?.doctor?.user) {
                await prisma.notification.create({
                    data: {
                        targetUserId: order.visit.doctor.user.id,
                        type: 'LAB_RESULT',
                        title: `Lab Result Ready: ${order.testName}`,
                        body: `Results for ${order.patient.firstName} ${order.patient.lastName} are now available.`,
                        priority: 'NORMAL',
                        visitId: order.visitId,
                        labOrderId: order.id
                    }
                });
            }
            // Statutory Alert for Notifiable Diseases
            const catalogEntry = await prisma.labCatalog.findUnique({
                where: { testName: order.testName }
            });
            
            if (catalogEntry?.isNotifiable && hasCritical) {
                console.log(`[FHIR PUSH] Reporting Notifiable Disease ${order.testName} for UHID ${order.patient.uhid}`);
                // In production, an actual FHIR push would happen here.
            }
        }

        await logAudit(userId, 'LAB_ORDER_UPDATED', { orderId: id, status }, req.ip || null);

        res.status(200).json({ message: 'Order updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error });
    }
};

export const addLabTest = async (req: Request, res: Response) => {
    try {
        const { testName, department, price, parameters } = req.body;
        const test = await prisma.labCatalog.create({
            data: {
                testName,
                department,
                price: Number(price),
                ...(parameters && { parameters })
            }
        });
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add lab test', error });
    }
};

export const updateSampleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { sampleStatus } = req.body;
        const userId = (req as any).user.id;

        const order = await prisma.labOrder.update({
            where: { id: String(id) },
            data: {
                sampleStatus,
                ...(sampleStatus === 'COLLECTED' ? { collectedAt: new Date() } : {})
            }
        });

        await logAudit(userId, 'LAB_SAMPLE_UPDATED', { orderId: id, sampleStatus }, req.ip || null);
        res.status(200).json({ message: 'Sample status updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update sample status', error });
    }
};

export const getLabReport = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await prisma.labOrder.findUnique({
            where: { id: String(orderId) },
            include: {
                patient: true,
                visit: { include: { doctor: true } }
            }
        });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const catalog = await prisma.labCatalog.findUnique({
            where: { testName: order.testName }
        });

        const history = await prisma.labOrder.findMany({
            where: {
                patientId: order.patientId,
                testName: order.testName,
                status: 'RESULT_ENTERED',
                id: { not: order.id }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        res.status(200).json({ order, catalog, history });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch report', error });
    }
};

// Phase 17: AI Virtual Pathologist
export const generateLabInterpretationAI = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await prisma.labOrder.findUnique({
            where: { id: String(orderId) }
        });

        if (!order) return res.status(404).json({ message: 'Order not found' });

        const resultsPayload = order.resultsPayload as any;
        if (!resultsPayload || !Array.isArray(resultsPayload) || resultsPayload.length === 0) {
            return res.status(400).json({ message: 'No results provided for analysis' });
        }

        const history = await prisma.labOrder.findMany({
            where: {
                patientId: order.patientId,
                testName: order.testName,
                status: 'RESULT_ENTERED',
                id: { not: order.id }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const prompt = `You are an AI Clinical Pathologist. Analyze the following laboratory test parameter results. Focus particularly on properties marked "isAbnormal": true. Compare it with the historical data if available to provide a trend summary (e.g. "Glucose is 15% higher than last month").
        Return ONLY a valid JSON object matching this exact shape: 
        {"clinicalSummary": "Overall analysis sentence including historical context if applicable", "differentials": ["List of potential diagnoses"], "recommendations": ["List of actionable doctor suggestions"]}.
        Do NOT wrap the JSON in Markdown formatting like \`\`\`json. Return pure JSON object only.
        
        Current Test Results Payload:
        ${JSON.stringify(resultsPayload)}

        Historical Results Payload (Last 5):
        ${JSON.stringify(history.map(h => ({ date: h.createdAt, results: h.resultsPayload })))}`;

        const interpretationStr = await callGemma(prompt);
        let interpretation;
        try {
            interpretation = JSON.parse(interpretationStr);
        } catch (e) {
            interpretation = interpretationStr;
        }

        await prisma.labOrder.update({
            where: { id: order.id },
            data: { aiSummary: interpretation }
        });

        res.status(200).json({
            status: 'SUCCESS',
            interpretation
        });
    } catch (error) {
        console.error("AI Lab Interpretation error", error);
        res.status(500).json({ message: 'AI Interpretation failed', error });
    }
};
