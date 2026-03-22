import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

// Get Ledgers & P&L Summary
export const getAccountSummary = async (req: Request, res: Response) => {
    try {
        const ledgers = await prisma.ledger.findMany();

        // Revenue (from PAID Pills)
        const bills = await prisma.bill.findMany({ where: { status: 'PAID' } });
        const totalOutwardGst = bills.reduce((sum, b) => sum + b.gstAmount, 0);
        const totalRevenue = bills.reduce((sum, b) => sum + b.subTotal, 0);
        const totalDiscounts = bills.reduce((sum, b) => sum + b.discount, 0);

        // Expenses (from PAID Expenses)
        const expenses = await prisma.expense.findMany({ where: { status: 'PAID' } });
        const totalInputGst = expenses.reduce((sum, e) => sum + e.gstAmount, 0);
        const totalTdsDeducted = expenses.reduce((sum, e) => sum + e.tdsAmount, 0);
        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

        res.status(200).json({
            ledgers,
            summary: {
                totalRevenue: totalRevenue - totalDiscounts,
                totalExpense,
                netProfit: (totalRevenue - totalDiscounts) - totalExpense,
            },
            compliance: {
                outwardGstCollected: totalOutwardGst,
                inputGstPaid: totalInputGst,
                netGstPayable: totalOutwardGst - totalInputGst, // (Outward - Input tax credit)
                tdsDeducted: totalTdsDeducted
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching accounts summary', error });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses', error });
    }
};

export const addExpense = async (req: Request, res: Response) => {
    try {
        const { category, description, amount, gstAmount, tdsAmount, paymentMode, date } = req.body;
        const userId = (req as any).user.id;

        const netAmount = (amount + (gstAmount || 0)) - (tdsAmount || 0);
        const expense = await prisma.expense.create({
            data: {
                voucherNo: `VCH-${Date.now()}`,
                category,
                description,
                amount: Number(amount),
                gstAmount: Number(gstAmount || 0),
                tdsAmount: Number(tdsAmount || 0),
                netAmount,
                paymentMode,
                date: date ? new Date(date) : new Date(),
                status: 'PENDING'
            }
        });

        await logAudit(userId, 'EXPENSE_RECORDED', { expenseId: expense.id, amount }, req.ip || null);

        res.status(201).json({ message: 'Expense Recorded', expense });
    } catch (error) {
        res.status(500).json({ message: 'Error recording expense', error });
    }
};

export const payExpense = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const expense = await prisma.expense.update({
            where: { id: String(id) },
            data: { status: 'PAID' }
        });

        await logAudit(userId, 'EXPENSE_PAID', { expenseId: expense.id }, req.ip || null);

        res.status(200).json({ message: 'Expense Marked as Paid', expense });
    } catch (error) {
        res.status(500).json({ message: 'Error updating expense status', error });
    }
};
