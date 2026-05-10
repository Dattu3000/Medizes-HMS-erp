import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

export const markAttendance = async (req: Request, res: Response) => {
    try {
        const { employeeId, status, date } = req.body;
        const userId = (req as any).user.id;

        // Normalize date to midnight UTC for unique constraint
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setUTCHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date: targetDate
                }
            },
            update: {
                status,
                checkIn: status === 'PRESENT' ? new Date() : null, // Simplistic checkIn logic for demo
            },
            create: {
                employeeId,
                date: targetDate,
                status,
                checkIn: status === 'PRESENT' ? new Date() : null,
            }
        });

        await logAudit(userId, 'ATTENDANCE_MARKED', { employeeId, status }, req.ip || null);
        res.status(200).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: 'Error marking attendance', error });
    }
};

export const getAttendance = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        let targetDate = new Date();
        if (date) {
            targetDate = new Date(String(date));
        }
        targetDate.setUTCHours(0, 0, 0, 0);

        const attendance = await prisma.attendance.findMany({
            where: { date: targetDate },
            include: { employee: true }
        });
        res.status(200).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'error fetching attendance', error });
    }
}

export const getPayroll = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) return res.status(400).json({ message: 'Month and year required' });

        const payrolls = await prisma.payroll.findMany({
            where: { month: Number(month), year: Number(year) },
            include: {
                employee: { include: { user: { select: { employeeId: true } } } }
            }
        });

        res.status(200).json(payrolls);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payroll', error });
    }
};

export const generatePayroll = async (req: Request, res: Response) => {
    try {
        const { employeeId, month, year, basicSalary, allowances, deductions } = req.body;
        const userId = (req as any).user.id;

        const netSalary = (basicSalary + allowances) - deductions;

        const payroll = await prisma.payroll.upsert({
            where: {
                employeeId_month_year: {
                    employeeId, month: Number(month), year: Number(year)
                }
            },
            update: {
                basicSalary, allowances, deductions, netSalary
            },
            create: {
                employeeId, month: Number(month), year: Number(year),
                basicSalary, allowances, deductions, netSalary,
                status: 'PENDING'
            }
        });

        await logAudit(userId, 'PAYROLL_GENERATED', { employeeId, month, year }, req.ip || null);
        res.status(200).json({ message: 'Payroll generated successfully', payroll });
    } catch (error) {
        res.status(500).json({ message: 'Error generating payroll', error });
    }
};

export const processPayroll = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const result = await prisma.$transaction(async (tx) => {
            const payroll = await tx.payroll.update({
                where: { id: String(id) },
                data: { status: 'PAID', paymentDate: new Date() },
                include: { employee: true }
            });

            // 1. Ensure Required Ledgers Exist
            const salaryExpense = await tx.ledger.upsert({
                where: { name: 'Salary Expense' },
                update: {},
                create: { name: 'Salary Expense', group: 'Indirect Expenses', accountType: 'DETAIL' }
            });
            const tdsPayable = await tx.ledger.upsert({
                where: { name: 'TDS Payable' },
                update: {},
                create: { name: 'TDS Payable', group: 'Current Liabilities', accountType: 'DETAIL' }
            });
            const bankAccount = await tx.ledger.upsert({
                where: { name: 'Main Bank Account' },
                update: {},
                create: { name: 'Main Bank Account', group: 'Bank Accounts', accountType: 'DETAIL' }
            });

            // 2. Create Journal Entry
            const grossSalary = payroll.basicSalary + payroll.allowances;
            const entryNo = `JE-PAY-${Date.now()}`;
            
            const je = await tx.journalEntry.create({
                data: {
                    entryNo,
                    narration: `Payroll for ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.month}/${payroll.year})`,
                    referenceId: payroll.id,
                    referenceType: 'PAYROLL',
                    lines: {
                        create: [
                            { ledgerId: salaryExpense.id, debit: grossSalary, credit: 0 },
                            ...(payroll.deductions > 0 ? [{ ledgerId: tdsPayable.id, debit: 0, credit: payroll.deductions }] : []),
                            { ledgerId: bankAccount.id, debit: 0, credit: payroll.netSalary }
                        ]
                    }
                }
            });

            // 3. Update Ledger Balances (Simplified for Demo)
            await tx.ledger.update({ where: { id: salaryExpense.id }, data: { balance: { increment: grossSalary } } });
            if (payroll.deductions > 0) {
                await tx.ledger.update({ where: { id: tdsPayable.id }, data: { balance: { increment: payroll.deductions } } });
            }
            await tx.ledger.update({ where: { id: bankAccount.id }, data: { balance: { decrement: payroll.netSalary } } });

            return payroll;
        });

        res.status(200).json({ message: 'Payroll Processed & Posted to Ledger', payroll: result });
    } catch (err) { 
        console.error("Payroll Error:", err);
        res.status(500).json({ message: 'Error processing payroll', err }); 
    }
};
