import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

// ═══════════════════════════════════════════════
// 1. CHART OF ACCOUNTS (Hierarchical Tree)
// ═══════════════════════════════════════════════
export const getChartOfAccounts = async (req: Request, res: Response) => {
    try {
        const accounts = await prisma.ledger.findMany({
            include: {
                children: true,
                _count: { select: { journalLines: true, transactions: true } }
            },
            orderBy: [{ group: 'asc' }, { code: 'asc' }]
        });

        // Build tree: root accounts (no parentId) with nested children
        const roots = accounts.filter(a => !a.parentId);
        const tree = roots.map(root => ({
            ...root,
            children: accounts.filter(a => a.parentId === root.id)
        }));

        // Group by type for UI sections
        const grouped = {
            ASSET: tree.filter(a => a.group === 'ASSET'),
            LIABILITY: tree.filter(a => a.group === 'LIABILITY'),
            EQUITY: tree.filter(a => a.group === 'EQUITY'),
            INCOME: tree.filter(a => a.group === 'INCOME'),
            EXPENSE: tree.filter(a => a.group === 'EXPENSE')
        };

        res.status(200).json({ tree, grouped, totalAccounts: accounts.length });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chart of accounts', error });
    }
};

// Seed default CoA if empty
export const seedChartOfAccounts = async (req: Request, res: Response) => {
    try {
        const count = await prisma.ledger.count();
        if (count > 0) {
            return res.status(200).json({ message: 'Chart of Accounts already has entries', count });
        }

        const defaults = [
            { code: '1000', name: 'Cash & Bank', group: 'ASSET', accountType: 'CONTROL' },
            { code: '1001', name: 'Cash A/c', group: 'ASSET', accountType: 'DETAIL' },
            { code: '1002', name: 'Bank A/c', group: 'ASSET', accountType: 'DETAIL' },
            { code: '1100', name: 'Accounts Receivable', group: 'ASSET', accountType: 'CONTROL' },
            { code: '1101', name: 'Patient Receivables', group: 'ASSET', accountType: 'DETAIL' },
            { code: '2000', name: 'Current Liabilities', group: 'LIABILITY', accountType: 'CONTROL' },
            { code: '2001', name: 'Accounts Payable', group: 'LIABILITY', accountType: 'DETAIL' },
            { code: '2002', name: 'GST Payable', group: 'LIABILITY', accountType: 'DETAIL' },
            { code: '2003', name: 'TDS Payable', group: 'LIABILITY', accountType: 'DETAIL' },
            { code: '3000', name: 'Equity', group: 'EQUITY', accountType: 'CONTROL' },
            { code: '3001', name: 'Retained Earnings', group: 'EQUITY', accountType: 'DETAIL' },
            { code: '4000', name: 'Revenue', group: 'INCOME', accountType: 'CONTROL' },
            { code: '4001', name: 'OPD Consultation Revenue', group: 'INCOME', accountType: 'DETAIL' },
            { code: '4002', name: 'Lab Diagnostics Revenue', group: 'INCOME', accountType: 'DETAIL' },
            { code: '4003', name: 'Pharmacy Revenue', group: 'INCOME', accountType: 'DETAIL' },
            { code: '4004', name: 'IPD Revenue', group: 'INCOME', accountType: 'DETAIL' },
            { code: '5000', name: 'Operating Expenses', group: 'EXPENSE', accountType: 'CONTROL' },
            { code: '5001', name: 'Salary & Wages', group: 'EXPENSE', accountType: 'DETAIL' },
            { code: '5002', name: 'Rent & Lease', group: 'EXPENSE', accountType: 'DETAIL' },
            { code: '5003', name: 'Utilities', group: 'EXPENSE', accountType: 'DETAIL' },
            { code: '5004', name: 'Medical Supplies', group: 'EXPENSE', accountType: 'DETAIL' },
            { code: '5005', name: 'Maintenance', group: 'EXPENSE', accountType: 'DETAIL' },
            { code: '5006', name: 'General Expenses A/c', group: 'EXPENSE', accountType: 'DETAIL' },
        ];

        // Create parent accounts first, then children
        const parentMap: Record<string, string> = {};
        for (const acc of defaults) {
            if (acc.accountType === 'CONTROL') {
                const created = await prisma.ledger.upsert({
                    where: { name: acc.name },
                    update: { code: acc.code, accountType: acc.accountType },
                    create: acc
                });
                parentMap[acc.code] = created.id;
            }
        }

        for (const acc of defaults) {
            if (acc.accountType === 'DETAIL') {
                const parentCode = acc.code.substring(0, 2) + '00';
                const parentId = parentMap[parentCode] || null;
                await prisma.ledger.upsert({
                    where: { name: acc.name },
                    update: { code: acc.code, accountType: acc.accountType, parentId },
                    create: { ...acc, parentId }
                });
            }
        }

        res.status(201).json({ message: 'Chart of Accounts seeded', count: defaults.length });
    } catch (error) {
        console.error('Seed CoA error', error);
        res.status(500).json({ message: 'Error seeding chart of accounts', error });
    }
};

// ═══════════════════════════════════════════════
// 2. JOURNAL ENTRIES (Double-Entry Bookkeeping)
// ═══════════════════════════════════════════════
export const createJournalEntry = async (req: Request, res: Response) => {
    try {
        const { narration, date, lines, referenceId, referenceType } = req.body;
        const userId = (req as any).user?.id;

        if (!lines || lines.length < 2) {
            return res.status(400).json({ message: 'Journal entry requires at least 2 lines (debit + credit)' });
        }

        // Validate: Total debits must equal total credits
        const totalDebit = lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
        const totalCredit = lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return res.status(400).json({
                message: `Debits (₹${totalDebit.toFixed(2)}) must equal Credits (₹${totalCredit.toFixed(2)})`,
                totalDebit, totalCredit
            });
        }

        // Generate entry number
        const count = await prisma.journalEntry.count();
        const entryNo = `JE-${String(count + 1).padStart(6, '0')}`;

        const entry = await prisma.journalEntry.create({
            data: {
                entryNo,
                narration,
                date: date ? new Date(date) : new Date(),
                referenceId: referenceId || null,
                referenceType: referenceType || 'MANUAL',
                lines: {
                    create: lines.map((l: any) => ({
                        ledgerId: l.ledgerId,
                        debit: Number(l.debit) || 0,
                        credit: Number(l.credit) || 0
                    }))
                }
            },
            include: { lines: { include: { ledger: true } } }
        });

        // Update ledger balances
        for (const line of entry.lines) {
            const isAssetOrExpense = ['ASSET', 'EXPENSE'].includes(line.ledger.group);
            const delta = isAssetOrExpense
                ? (line.debit - line.credit) // Debits increase, credits decrease
                : (line.credit - line.debit); // Credits increase, debits decrease
            await prisma.ledger.update({
                where: { id: line.ledgerId },
                data: { balance: { increment: delta } }
            });
        }

        if (userId) {
            await logAudit(userId, 'JOURNAL_ENTRY_CREATED', { entryNo, totalDebit }, req.ip || null);
        }

        res.status(201).json(entry);
    } catch (error) {
        console.error('Journal entry error', error);
        res.status(500).json({ message: 'Error creating journal entry', error });
    }
};

export const getJournalEntries = async (req: Request, res: Response) => {
    try {
        const { from, to, status } = req.query;
        const where: any = {};
        if (status) where.status = String(status);
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(String(from));
            if (to) where.date.lte = new Date(String(to));
        }

        const entries = await prisma.journalEntry.findMany({
            where,
            include: { lines: { include: { ledger: { select: { name: true, code: true, group: true } } } } },
            orderBy: { date: 'desc' },
            take: 200
        });
        res.status(200).json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching journal entries', error });
    }
};

// ═══════════════════════════════════════════════
// 3. TRIAL BALANCE (Period-Filtered)
// ═══════════════════════════════════════════════
export const getTrialBalance = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        let dateFilter: any = {};
        if (month && year) {
            const m = parseInt(String(month), 10);
            const y = parseInt(String(year), 10);
            dateFilter = { createdAt: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } };
        }

        const ledgers = await prisma.ledger.findMany({
            where: { isActive: true },
            include: {
                journalLines: { where: dateFilter }
            },
            orderBy: { code: 'asc' }
        });

        const trialBalance = ledgers.map(ledger => {
            const totalDebit = ledger.journalLines.reduce((s, l) => s + l.debit, 0);
            const totalCredit = ledger.journalLines.reduce((s, l) => s + l.credit, 0);
            return {
                code: ledger.code,
                name: ledger.name,
                group: ledger.group,
                accountType: ledger.accountType,
                totalDebit,
                totalCredit,
                balance: ledger.balance,
                netMovement: totalDebit - totalCredit
            };
        }).filter(tb => tb.totalDebit > 0 || tb.totalCredit > 0 || tb.balance !== 0);

        const totals = {
            debit: trialBalance.reduce((s, t) => s + t.totalDebit, 0),
            credit: trialBalance.reduce((s, t) => s + t.totalCredit, 0),
            isBalanced: Math.abs(trialBalance.reduce((s, t) => s + t.totalDebit, 0) - trialBalance.reduce((s, t) => s + t.totalCredit, 0)) < 0.01
        };

        res.status(200).json({ trialBalance, totals });
    } catch (error) {
        res.status(500).json({ message: 'Error generating trial balance', error });
    }
};

// ═══════════════════════════════════════════════
// 4. PROFIT & LOSS with Date Range
// ═══════════════════════════════════════════════
export const getProfitLoss = async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;
        const dateFilter: any = {};
        if (from) dateFilter.gte = new Date(String(from));
        if (to) dateFilter.lte = new Date(String(to));

        const billWhere: any = { status: 'PAID' };
        const expenseWhere: any = { status: 'PAID' };
        if (from || to) {
            billWhere.createdAt = dateFilter;
            expenseWhere.createdAt = dateFilter;
        }

        const [bills, expenses, payrolls] = await Promise.all([
            prisma.bill.findMany({ where: billWhere }),
            prisma.expense.findMany({ where: expenseWhere }),
            prisma.payroll.findMany({ where: { status: 'PAID' } })
        ]);

        const incomeByType: Record<string, number> = {};
        let totalIncome = 0;
        for (const b of bills) {
            const net = b.subTotal - b.discount;
            incomeByType[b.type] = (incomeByType[b.type] || 0) + net;
            totalIncome += net;
        }

        const expenseByCategory: Record<string, number> = {};
        let totalExpense = 0;
        for (const e of expenses) {
            expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
            totalExpense += e.amount;
        }

        const totalSalaries = payrolls.reduce((s, p) => s + p.netSalary, 0);
        if (totalSalaries > 0) {
            expenseByCategory['SALARY_PAYROLL'] = totalSalaries;
            totalExpense += totalSalaries;
        }

        const totalGstCollected = bills.reduce((s, b) => s + b.gstAmount, 0);
        const totalGstPaid = expenses.reduce((s, e) => s + e.gstAmount, 0);

        res.status(200).json({
            period: { from: from || 'All Time', to: to || 'Now' },
            income: { breakdown: incomeByType, total: totalIncome },
            expenses: { breakdown: expenseByCategory, total: totalExpense },
            netProfitOrLoss: totalIncome - totalExpense,
            surplus: (totalIncome - totalExpense) >= 0 ? 'PROFIT' : 'LOSS',
            gst: { collected: totalGstCollected, paid: totalGstPaid, net: totalGstCollected - totalGstPaid },
            margins: {
                grossMargin: totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : '0.0',
                operatingRatio: totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0.0'
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating P&L', error });
    }
};

// ═══════════════════════════════════════════════
// 5. CASH FLOW STATEMENT
// ═══════════════════════════════════════════════
export const getCashFlow = async (req: Request, res: Response) => {
    try {
        const [paidBills, paidExpenses, paidPayrolls] = await Promise.all([
            prisma.bill.findMany({ where: { status: 'PAID' } }),
            prisma.expense.findMany({ where: { status: 'PAID' } }),
            prisma.payroll.findMany({ where: { status: 'PAID' } })
        ]);

        // Operating
        const cashFromPatients = paidBills.reduce((s, b) => s + b.netPayable, 0);
        const cashToVendors = paidExpenses.reduce((s, e) => s + e.netAmount, 0);
        const cashToEmployees = paidPayrolls.reduce((s, p) => s + p.netSalary, 0);
        const gstCollected = paidBills.reduce((s, b) => s + b.gstAmount, 0);
        const gstPaid = paidExpenses.reduce((s, e) => s + e.gstAmount, 0);
        const netOperating = cashFromPatients - cashToVendors - cashToEmployees - (gstCollected - gstPaid);

        // Investing (placeholder — equipment purchases would go here)
        const investing = { equipmentPurchases: 0, total: 0 };

        // Financing (placeholder — loans, owner draws)
        const financing = { loanRepayments: 0, ownerDraws: 0, total: 0 };

        const netCashChange = netOperating + investing.total + financing.total;

        res.status(200).json({
            operating: {
                cashFromPatients,
                cashToVendors: -cashToVendors,
                cashToEmployees: -cashToEmployees,
                gstNet: -(gstCollected - gstPaid),
                total: netOperating
            },
            investing,
            financing,
            netCashChange,
            closingBalance: netCashChange
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating cash flow', error });
    }
};

// ═══════════════════════════════════════════════
// 6. ACCOUNTS RECEIVABLE AGING
// ═══════════════════════════════════════════════
export const getReceivableAging = async (req: Request, res: Response) => {
    try {
        // All unpaid bills = receivables
        const unpaidBills = await prisma.bill.findMany({
            where: { status: 'UNPAID' },
            orderBy: { createdAt: 'asc' }
        });

        const now = new Date();
        const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
        const details: any[] = [];

        for (const bill of unpaidBills) {
            const daysPast = Math.floor((now.getTime() - new Date(bill.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            let bucket = 'current';
            if (daysPast > 90) { bucket = 'over90'; buckets.over90 += bill.netPayable; }
            else if (daysPast > 60) { bucket = 'days90'; buckets.days90 += bill.netPayable; }
            else if (daysPast > 30) { bucket = 'days60'; buckets.days60 += bill.netPayable; }
            else if (daysPast > 0) { bucket = 'days30'; buckets.days30 += bill.netPayable; }
            else { buckets.current += bill.netPayable; }

            details.push({
                billNo: bill.billNo,
                type: bill.type,
                amount: bill.netPayable,
                daysPast,
                bucket,
                date: bill.createdAt
            });
        }

        const totalOutstanding = Object.values(buckets).reduce((s, v) => s + v, 0);

        res.status(200).json({
            buckets,
            totalOutstanding,
            count: unpaidBills.length,
            details
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating AR aging', error });
    }
};

// ═══════════════════════════════════════════════
// 7. ACCOUNTS PAYABLE AGING
// ═══════════════════════════════════════════════
export const getPayableAging = async (req: Request, res: Response) => {
    try {
        const unpaidExpenses = await prisma.expense.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'asc' }
        });

        const now = new Date();
        const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
        const details: any[] = [];

        for (const exp of unpaidExpenses) {
            const daysPast = Math.floor((now.getTime() - new Date(exp.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            let bucket = 'current';
            if (daysPast > 90) { bucket = 'over90'; buckets.over90 += exp.netAmount; }
            else if (daysPast > 60) { bucket = 'days90'; buckets.days90 += exp.netAmount; }
            else if (daysPast > 30) { bucket = 'days60'; buckets.days60 += exp.netAmount; }
            else if (daysPast > 0) { bucket = 'days30'; buckets.days30 += exp.netAmount; }
            else { buckets.current += exp.netAmount; }

            details.push({
                voucherNo: exp.voucherNo,
                category: exp.category,
                description: exp.description,
                amount: exp.netAmount,
                daysPast,
                bucket,
                date: exp.createdAt
            });
        }

        res.status(200).json({
            buckets,
            totalOutstanding: Object.values(buckets).reduce((s, v) => s + v, 0),
            count: unpaidExpenses.length,
            details
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating AP aging', error });
    }
};

// ═══════════════════════════════════════════════
// 8. DAY BOOK (Chronological Register)
// ═══════════════════════════════════════════════
export const getDayBook = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        const target = date ? new Date(String(date)) : new Date();
        const startOfDay = new Date(target); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(target); endOfDay.setHours(23, 59, 59, 999);

        const [transactions, journalEntries, bills, expenses] = await Promise.all([
            prisma.transaction.findMany({
                where: { createdAt: { gte: startOfDay, lte: endOfDay } },
                include: { ledger: { select: { name: true, code: true } } },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.journalEntry.findMany({
                where: { date: { gte: startOfDay, lte: endOfDay } },
                include: { lines: { include: { ledger: { select: { name: true, code: true } } } } },
                orderBy: { date: 'asc' }
            }),
            prisma.bill.findMany({
                where: { createdAt: { gte: startOfDay, lte: endOfDay } },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.expense.findMany({
                where: { createdAt: { gte: startOfDay, lte: endOfDay } },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        res.status(200).json({
            date: target.toISOString().split('T')[0],
            transactions,
            journalEntries,
            bills: {
                items: bills,
                totalBilled: bills.reduce((s, b) => s + b.netPayable, 0),
                paidCount: bills.filter(b => b.status === 'PAID').length
            },
            expenses: {
                items: expenses,
                totalExpensed: expenses.reduce((s, e) => s + e.netAmount, 0)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching day book', error });
    }
};

// ═══════════════════════════════════════════════
// 9. FINANCIAL PERIOD MANAGEMENT
// ═══════════════════════════════════════════════
export const getFinancialPeriods = async (req: Request, res: Response) => {
    try {
        const periods = await prisma.financialPeriod.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        res.status(200).json(periods);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching periods', error });
    }
};

export const closePeriod = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const userId = (req as any).user?.id;

        const period = await prisma.financialPeriod.upsert({
            where: { month_year: { month: Number(month), year: Number(year) } },
            update: { status: 'CLOSED', closedById: userId, closedAt: new Date() },
            create: { month: Number(month), year: Number(year), status: 'CLOSED', closedById: userId, closedAt: new Date() }
        });

        if (userId) {
            await logAudit(userId, 'PERIOD_CLOSED', { month, year }, req.ip || null);
        }

        res.status(200).json({ message: `Period ${month}/${year} closed`, period });
    } catch (error) {
        res.status(500).json({ message: 'Error closing period', error });
    }
};

// ═══════════════════════════════════════════════
// 10. AI FINANCIAL ADVISOR 🤖
// ═══════════════════════════════════════════════
export const analyzeFinancesAI = async (req: Request, res: Response) => {
    try {
        const [bills, expenses, payrolls, unpaidBills] = await Promise.all([
            prisma.bill.findMany({ where: { status: 'PAID' } }),
            prisma.expense.findMany({ where: { status: 'PAID' } }),
            prisma.payroll.findMany({ where: { status: 'PAID' } }),
            prisma.bill.findMany({ where: { status: 'UNPAID' } })
        ]);

        const totalRevenue = bills.reduce((s, b) => s + (b.subTotal - b.discount), 0);
        const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
        const totalPayroll = payrolls.reduce((s, p) => s + p.netSalary, 0);
        const totalUnpaid = unpaidBills.reduce((s, b) => s + b.netPayable, 0);
        const allCosts = totalExpense + totalPayroll;
        const profitMargin = totalRevenue > 0 ? ((totalRevenue - allCosts) / totalRevenue * 100) : 0;

        // Expense category analysis
        const categoryTotals: Record<string, number> = {};
        for (const e of expenses) {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        }
        const topExpense = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

        // Revenue by type
        const revByType: Record<string, number> = {};
        for (const b of bills) {
            revByType[b.type] = (revByType[b.type] || 0) + (b.subTotal - b.discount);
        }
        const topRevenue = Object.entries(revByType).sort((a, b) => b[1] - a[1])[0];

        // Build AI insights
        const insights: any[] = [];
        const anomalies: any[] = [];
        const recommendations: any[] = [];

        // 1. Profitability
        if (profitMargin < 10) {
            insights.push({
                type: 'WARNING',
                title: 'Low Profit Margin Alert',
                detail: `Current operating margin is ${profitMargin.toFixed(1)}%. Healthy hospitals operate above 15%. Consider reviewing vendor contracts and staffing ratios.`
            });
        } else if (profitMargin > 30) {
            insights.push({
                type: 'SUCCESS',
                title: 'Strong Profitability',
                detail: `Excellent operating margin of ${profitMargin.toFixed(1)}%. The hospital is financially strong. Consider reinvesting in equipment upgrades.`
            });
        } else {
            insights.push({
                type: 'INFO',
                title: 'Healthy Operating Margin',
                detail: `Operating margin is a reasonable ${profitMargin.toFixed(1)}%. Industry average for mid-tier hospitals is 12-20%.`
            });
        }

        // 2. AR Risk
        if (totalUnpaid > totalRevenue * 0.3) {
            anomalies.push({
                type: 'CRITICAL',
                title: 'High Accounts Receivable Risk',
                detail: `₹${totalUnpaid.toLocaleString()} in unpaid bills (${((totalUnpaid / (totalRevenue || 1)) * 100).toFixed(0)}% of revenue). This is above safe threshold. Increase collection follow-ups.`
            });
        }

        // 3. Payroll ratio
        const payrollRatio = totalRevenue > 0 ? (totalPayroll / totalRevenue * 100) : 0;
        if (payrollRatio > 55) {
            anomalies.push({
                type: 'WARNING',
                title: 'Payroll Overhead Alert',
                detail: `Staff costs consume ${payrollRatio.toFixed(0)}% of revenue. Hospital best practice is below 55%. Review overtime approvals and temporary contractor costs.`
            });
        }

        // 4. Top expense reco
        if (topExpense) {
            recommendations.push({
                title: 'Largest Expense Category',
                detail: `"${topExpense[0].replace(/_/g, ' ')}" accounts for ₹${topExpense[1].toLocaleString()} (${totalExpense > 0 ? ((topExpense[1] / totalExpense) * 100).toFixed(0) : 0}% of OpEx). Negotiate bulk vendor contracts to reduce by 5-10%.`
            });
        }

        // 5. Revenue diversification
        if (topRevenue && totalRevenue > 0) {
            const topPct = (topRevenue[1] / totalRevenue * 100);
            if (topPct > 60) {
                recommendations.push({
                    title: 'Revenue Concentration Risk',
                    detail: `${topPct.toFixed(0)}% of revenue comes from "${topRevenue[0].replace(/_/g, ' ')}". Diversify into other service lines to reduce risk.`
                });
            }
        }

        // 6. Collection efficiency
        const totalBilled = bills.reduce((s, b) => s + b.netPayable, 0) + totalUnpaid;
        const collectionRate = totalBilled > 0 ? ((bills.reduce((s, b) => s + b.netPayable, 0) / totalBilled) * 100) : 100;
        recommendations.push({
            title: 'Collection Efficiency',
            detail: `Current collection rate is ${collectionRate.toFixed(1)}%. ${collectionRate < 85 ? 'Below target. Implement automated payment reminders.' : 'On track with industry benchmarks.'}`
        });

        res.status(200).json({
            summary: {
                totalRevenue,
                totalCosts: allCosts,
                profitMargin: profitMargin.toFixed(1),
                unpaidReceivables: totalUnpaid,
                payrollRatio: payrollRatio.toFixed(1),
                collectionRate: collectionRate.toFixed(1)
            },
            insights,
            anomalies,
            recommendations,
            generatedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating AI analysis', error });
    }
};

// ═══════════════════════════════════════════════
// LEGACY: Keep existing endpoints working
// ═══════════════════════════════════════════════
export const getAccountSummary = async (req: Request, res: Response) => {
    try {
        const ledgers = await prisma.ledger.findMany({
            include: {
                transactions: { orderBy: { createdAt: 'desc' }, take: 10 }
            }
        });

        const bills = await prisma.bill.findMany({ where: { status: 'PAID' } });
        const totalOutwardGst = bills.reduce((sum, b) => sum + b.gstAmount, 0);
        const totalRevenue = bills.reduce((sum, b) => sum + b.subTotal, 0);
        const totalDiscounts = bills.reduce((sum, b) => sum + b.discount, 0);

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
                netGstPayable: totalOutwardGst - totalInputGst,
                tdsDeducted: totalTdsDeducted
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching accounts summary', error });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const expenses = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
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
                category, description,
                amount: Number(amount),
                gstAmount: Number(gstAmount || 0),
                tdsAmount: Number(tdsAmount || 0),
                netAmount, paymentMode,
                date: date ? new Date(date) : new Date(),
                status: 'PENDING'
            }
        });

        // Sync with Ledger
        const expenseLedger = await prisma.ledger.upsert({
            where: { name: 'General Expenses A/c' },
            update: { balance: { increment: netAmount } },
            create: { name: 'General Expenses A/c', group: 'EXPENSE', balance: netAmount }
        });

        if (netAmount > 0) {
            await prisma.transaction.create({
                data: {
                    ledgerId: expenseLedger.id,
                    type: 'DEBIT',
                    amount: netAmount,
                    description: `Expense: ${category} - ${description}`,
                    referenceId: expense.id,
                    referenceType: 'EXPENSE'
                }
            });
        }

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
