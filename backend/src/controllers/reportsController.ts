import { Request, Response } from 'express';
import { prisma } from '../utils/db';

// ─────────────────────────────────────────
// BALANCE SHEET (Simplified Trial Balance)
// ─────────────────────────────────────────
export const getBalanceSheet = async (req: Request, res: Response) => {
    try {
        // Income side — all paid bills grouped by type
        const paidBills = await prisma.bill.findMany({ where: { status: 'PAID' } });

        const incomeByType: Record<string, number> = {};
        let totalIncome = 0;
        for (const b of paidBills) {
            incomeByType[b.type] = (incomeByType[b.type] || 0) + b.subTotal - b.discount;
            totalIncome += b.subTotal - b.discount;
        }

        // Expense side — all paid expenses grouped by category
        const paidExpenses = await prisma.expense.findMany({ where: { status: 'PAID' } });
        const expenseByCategory: Record<string, number> = {};
        let totalExpense = 0;
        for (const e of paidExpenses) {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
            totalExpense += e.amount;
        }

        // Payroll paid (count as salary expense)
        const paidPayrolls = await prisma.payroll.findMany({ where: { status: 'PAID' } });
        const totalSalaries = paidPayrolls.reduce((s: number, p: any) => s + p.netSalary, 0);
        expenseByCategory['SALARY_PAYROLL'] = totalSalaries;
        totalExpense += totalSalaries;

        const netProfitOrLoss = totalIncome - totalExpense;

        res.status(200).json({
            income: { breakdown: incomeByType, total: totalIncome },
            expenses: { breakdown: expenseByCategory, total: totalExpense },
            netProfitOrLoss,
            surplus: netProfitOrLoss >= 0 ? 'PROFIT' : 'LOSS'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating balance sheet', error });
    }
};

// ─────────────────────────────────────────
// GST REPORT (GSTR-1 / GSTR-3B)
// ─────────────────────────────────────────
export const getGSTReport = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query as { month?: string; year?: string };

        // Build date filter
        let dateFilter: any = {};
        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const from = new Date(y, m - 1, 1);
            const to = new Date(y, m, 0, 23, 59, 59);
            dateFilter = { createdAt: { gte: from, lte: to } };
        }

        // Outward supplies from bills
        const bills = await prisma.bill.findMany({
            where: { status: 'PAID', ...dateFilter }
        });

        const gstr1Lines = bills.map((b: any) => ({
            billNo: b.billNo,
            type: b.type,
            taxableValue: b.subTotal - b.discount,
            gstAmount: b.gstAmount,
            totalValue: b.netPayable,
            date: b.createdAt
        }));

        const totalTaxableValue = gstr1Lines.reduce((s: number, l: any) => s + l.taxableValue, 0);
        const totalOutwardGST = gstr1Lines.reduce((s: number, l: any) => s + l.gstAmount, 0);

        // Input Tax Credit from expenses
        const expenses = await prisma.expense.findMany({
            where: { status: 'PAID', ...dateFilter }
        });

        const inputTaxCredit = expenses.reduce((s: number, e: any) => s + e.gstAmount, 0);
        const tdsDeducted = expenses.reduce((s: number, e: any) => s + e.tdsAmount, 0);

        // GSTR‑3B net liability
        const netGstPayable = totalOutwardGST - inputTaxCredit;

        res.status(200).json({
            period: month && year ? `${month}/${year}` : 'All Time',
            gstr1: {
                lines: gstr1Lines,
                totalTaxableValue,
                totalOutwardGST
            },
            gstr3b: {
                outwardGST: totalOutwardGST,
                inputTaxCredit,
                netGstPayable
            },
            tdsDeducted
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating GST report', error });
    }
};

// ─────────────────────────────────────────
// PAYROLL COMPLIANCE (EPF / ESI / PT)
// ─────────────────────────────────────────
export const getPayrollCompliance = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query as { month?: string; year?: string };

        const where: any = { status: 'PAID' };
        if (month) where.month = parseInt(month, 10);
        if (year) where.year = parseInt(year, 10);

        const payrolls = await prisma.payroll.findMany({
            where,
            include: { employee: { include: { user: { select: { employeeId: true } } } } }
        });

        const EPF_RATE = 0.12; // 12% employee + 12% employer
        const ESI_RATE = 0.0325; // 3.25% employer
        const ESI_EMP_RATE = 0.0075; // 0.75% employee
        const PT_MONTHLY = 200; // ₹200 flat per employee per month (Karnataka slab for >₹15k)

        let totalEpfEmployee = 0;
        let totalEpfEmployer = 0;
        let totalEsiEmployee = 0;
        let totalEsiEmployer = 0;
        let totalPT = 0;

        const payslips = payrolls.map((p: any) => {
            const gross = p.basicSalary + p.allowances;

            const epfEmployee = parseFloat((p.basicSalary * EPF_RATE).toFixed(2));
            const epfEmployer = parseFloat((p.basicSalary * EPF_RATE).toFixed(2));
            const esiEmployee = gross <= 21000 ? parseFloat((gross * ESI_EMP_RATE).toFixed(2)) : 0;
            const esiEmployer = gross <= 21000 ? parseFloat((gross * ESI_RATE).toFixed(2)) : 0;
            const pt = gross > 15000 ? PT_MONTHLY : 0;
            const totalDeductions = p.deductions + epfEmployee + esiEmployee + pt;
            const takehomeSalary = gross - totalDeductions;

            totalEpfEmployee += epfEmployee;
            totalEpfEmployer += epfEmployer;
            totalEsiEmployee += esiEmployee;
            totalEsiEmployer += esiEmployer;
            totalPT += pt;

            return {
                employeeId: p.employee.user.employeeId,
                name: `${p.employee.firstName} ${p.employee.lastName}`,
                month: p.month,
                year: p.year,
                basicSalary: p.basicSalary,
                allowances: p.allowances,
                grossSalary: gross,
                epfEmployee,
                epfEmployer,
                esiEmployee,
                esiEmployer,
                pt,
                otherDeductions: p.deductions,
                totalDeductions,
                netTakeHome: parseFloat(takehomeSalary.toFixed(2))
            };
        });

        res.status(200).json({
            period: month && year ? `${month}/${year}` : 'All PAID Payrolls',
            payslips,
            compliance: {
                epf: {
                    employee: parseFloat(totalEpfEmployee.toFixed(2)),
                    employer: parseFloat(totalEpfEmployer.toFixed(2)),
                    total: parseFloat((totalEpfEmployee + totalEpfEmployer).toFixed(2))
                },
                esi: {
                    employee: parseFloat(totalEsiEmployee.toFixed(2)),
                    employer: parseFloat(totalEsiEmployer.toFixed(2)),
                    total: parseFloat((totalEsiEmployee + totalEsiEmployer).toFixed(2))
                },
                pt: {
                    total: parseFloat(totalPT.toFixed(2))
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating payroll compliance report', error });
    }
};

// ─────────────────────────────────────────
// DASHBOARD ANALYTICS
// ─────────────────────────────────────────
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const [
            totalPatients,
            totalVisits,
            totalAdmissions,
            activeAdmissions,
            totalLabOrders,
            pendingLabOrders,
            paidBills,
            unpaidBills,
            totalEmployees,
            recentVisits,
            recentAdmissions
        ] = await Promise.all([
            prisma.patient.count(),
            prisma.visit.count(),
            prisma.admission.count(),
            prisma.admission.count({ where: { status: 'ADMITTED' } }),
            prisma.labOrder.count(),
            prisma.labOrder.count({ where: { status: 'PENDING' } }),
            prisma.bill.findMany({ where: { status: 'PAID' }, select: { netPayable: true, type: true } }),
            prisma.bill.count({ where: { status: 'UNPAID' } }),
            prisma.employee.count(),
            prisma.visit.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true, department: true }
            }),
            prisma.admission.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true }
            })
        ]);

        const revenueByModule: Record<string, number> = {};
        let totalRevenue = 0;
        for (const b of paidBills) {
            revenueByModule[b.type] = (revenueByModule[b.type] || 0) + b.netPayable;
            totalRevenue += b.netPayable;
        }

        // Generate 7-day flow trend
        const flowTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });

            const startOfDay = new Date(d);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(d);
            endOfDay.setHours(23, 59, 59, 999);

            const outpatientCount = recentVisits.filter(v => v.createdAt >= startOfDay && v.createdAt <= endOfDay).length;
            const inpatientCount = recentAdmissions.filter(a => a.createdAt >= startOfDay && a.createdAt <= endOfDay).length;

            flowTrend.push({
                name: dayStr,
                outpatient: outpatientCount,
                inpatient: inpatientCount
            });
        }

        // Generate department distribution
        const deptCounts: Record<string, number> = {};
        for (const v of recentVisits) {
            const dept = v.department || 'General';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        }
        const departmentLoad = Object.keys(deptCounts).map(key => ({
            name: key,
            value: deptCounts[key]
        }));

        res.status(200).json({
            patients: { total: totalPatients, visits: totalVisits },
            ipd: { total: totalAdmissions, active: activeAdmissions },
            lab: { total: totalLabOrders, pending: pendingLabOrders },
            billing: { totalRevenue, unpaid: unpaidBills, byModule: revenueByModule },
            hr: { employees: totalEmployees },
            charts: {
                flowTrend,
                departmentLoad
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics', error });
    }
};
