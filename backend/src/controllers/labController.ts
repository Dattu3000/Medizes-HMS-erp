import { Request, Response } from 'express';
import { prisma } from '../utils/db';
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

        res.status(200).json({ order, catalog });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch report', error });
    }
};

// Phase 17: AI Virtual Pathologist
export const generateLabInterpretationAI = async (req: Request, res: Response) => {
    try {
        const { resultsPayload } = req.body;
        if (!resultsPayload || !Array.isArray(resultsPayload) || resultsPayload.length === 0) {
            return res.status(400).json({ message: 'No results provided for analysis' });
        }

        // Simulating LLM Processing Delay
        await new Promise(r => setTimeout(r, 1500));

        const abnormals = resultsPayload.filter((r: any) => r.isAbnormal);

        let clinicalSummary = "All tested parameters reside within normal physiological ranges. No acute pathological indicators detected.";
        const differentials: string[] = [];
        const recommendations: string[] = [];

        if (abnormals.length > 0) {
            clinicalSummary = `Identified ${abnormals.length} abnormal parameter(s) requiring clinical correlation.`;

            for (const param of abnormals) {
                const name = param.parameter.toLowerCase();
                if (name.includes('hemoglobin') || name.includes('hgb')) {
                    differentials.push('Anemia (Microcytic/Macrocytic depending on MCV), acute blood loss, or bone marrow suppression.');
                    recommendations.push('Consider ordering Iron Studies, B12/Folate levels, and a Reticulocyte count.');
                } else if (name.includes('wbc') || name.includes('white blood cell')) {
                    differentials.push('Leukocytosis/Leukopenia: Potential bacterial/viral infection, severe inflammation, or tissue necrosis.');
                    recommendations.push('Evaluate for clinical signs of infection. Consider CRP/ESR and blood cultures if febrile.');
                } else if (name.includes('glucose') || name.includes('sugar')) {
                    differentials.push('Hyper/Hypoglycemia: Potential Diabetes Mellitus or impaired glucose tolerance.');
                    recommendations.push('Advise HbA1c testing for 3-month glycemic control assessment. Lifestyle modifications recommended.');
                } else if (name.includes('platelet')) {
                    differentials.push('Thrombocytopenia/Thrombocytosis: Viral infection, immune destruction, or marrow irregularities.');
                    recommendations.push('Review medication profile for drug-induced etiology. Monitor for bleeding risks.');
                }
            }

            if (differentials.length === 0) {
                // Generic fallback for unmapped parameters
                differentials.push(`Aberrant levels in ${abnormals.map((a: any) => a.parameter).join(', ')}. Clinical context required.`);
                recommendations.push('Repeat test if spurious result suspected. Consult specialist if symptoms persist.');
            }
        }

        res.status(200).json({
            status: 'SUCCESS',
            interpretation: {
                clinicalSummary,
                differentials,
                recommendations
            }
        });
    } catch (error) {
        console.error("AI Lab Interpretation error", error);
        res.status(500).json({ message: 'AI Interpretation failed', error });
    }
};
