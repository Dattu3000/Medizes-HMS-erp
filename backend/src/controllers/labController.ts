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
                    status: 'PENDING'
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
        const { status, resultText } = req.body;
        const userId = (req as any).user.id;

        const order = await prisma.labOrder.update({
            where: { id: String(id) },
            data: {
                status,
                ...(resultText && { resultText })
            }
        });

        await logAudit(userId, 'LAB_ORDER_UPDATED', { orderId: id, status }, req.ip || null);

        res.status(200).json({ message: 'Order updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error });
    }
};

export const addLabTest = async (req: Request, res: Response) => {
    try {
        const { testName, department, price } = req.body;
        const test = await prisma.labCatalog.create({
            data: { testName, department, price: Number(price) }
        });
        res.status(201).json(test);
    } catch (error) {
        res.status(500).json({ message: 'Failed to add lab test', error });
    }
};
