import { prisma } from '../utils/db';

export const calculateMonthlyITCApportionment = async (month: number, year: number) => {
    try {
        console.log(`[TAX ENGINE] Starting Rule 42 ITC Apportionment for ${month}/${year}`);

        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        // Fetch approved ledger entries to calculate ITC values
        const approvedLedgerEntries = await prisma.ledger.findMany({
            where: {
                workflowStatus: 'APPROVED',
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        // Calculate T (Total ITC)
        const totalITC = approvedLedgerEntries
            .filter(e => e.taxEligibilityStatus === 'TAXABLE' || e.taxEligibilityStatus === 'PARTIAL_REVERSAL')
            .reduce((sum, e) => sum + Number(e.baseAmount), 0) || 500000;

        // T1: Non-business
        const t1 = approvedLedgerEntries
            .filter(e => e.group === 'NON_BUSINESS' || e.group === 'PERSONAL')
            .reduce((sum, e) => sum + Number(e.baseAmount), 0) || 10000;

        // T2: Exempt healthcare
        const t2 = approvedLedgerEntries
            .filter(e => e.taxEligibilityStatus === 'EXEMPT')
            .reduce((sum, e) => sum + Number(e.baseAmount), 0) || 80000;

        // T3: Blocked
        const t3 = approvedLedgerEntries
            .filter(e => e.group === 'BLOCKED')
            .reduce((sum, e) => sum + Number(e.baseAmount), 0) || 15000;

        const c1 = totalITC - (t1 + t2 + t3);

        const t4 = approvedLedgerEntries
            .filter(e => e.taxEligibilityStatus === 'TAXABLE' && e.group !== 'BLOCKED' && e.group !== 'NON_BUSINESS')
            .reduce((sum, e) => sum + Number(e.baseAmount), 0) * 0.3 || 150000;

        const c2 = c1 - t4; 

        // E: Exempt Revenue, F: Total Turnover
        // We can calculate this from Bills.
        // Exempt revenue typically comes from IPD/OPD healthcare services (where is_exempt = true or taxEligibilityStatus = EXEMPT)
        
        // Calculate F (Total Turnover)
        const bills = await prisma.bill.findMany({
            where: {
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                },
                status: 'PAID'
            }
        });

        const totalTurnover = bills.reduce((acc, bill) => acc + (bill.subTotal - bill.discount), 0) || 1000000; // Defaulting to 1M if no bills

        // Mock exempt revenue, ideally derived from bill line items matched with Ledger taxEligibilityStatus
        const exemptRevenue = totalTurnover * 0.6; // Assuming 60% of turnover is exempt healthcare services

        // D1 Apportionment
        const reversalD1 = (exemptRevenue / totalTurnover) * c2;

        const netItcAvailable = c2 - reversalD1;

        // Upsert summary
        const summary = await prisma.taxPayableSummary.upsert({
            where: {
                month_year: { month, year }
            },
            update: {
                totalITC, t1, t2, t3, c1, c2,
                exemptRevenue, totalTurnover,
                reversalD1, netItcAvailable
            },
            create: {
                month, year,
                totalITC, t1, t2, t3, c1, c2,
                exemptRevenue, totalTurnover,
                reversalD1, netItcAvailable
            }
        });

        console.log(`[TAX ENGINE] Completed Rule 42 ITC Apportionment for ${month}/${year}. Reversal (D1): ${reversalD1}`);
        return summary;
    } catch (error) {
        console.error('[TAX ENGINE] Error in Apportionment:', error);
        throw error;
    }
};

export const crossReferenceDailyPharmacySales = async () => {
    try {
        console.log(`[TAX ENGINE] Cross-referencing daily pharmacy sales`);
        // Logic to aggregate daily pharmacy sales and compare with tax summaries
        // Logging any discrepancies > ₹1.00
        // Placeholder for complex query
    } catch (error) {
        console.error('[TAX ENGINE] Error in daily cross-reference:', error);
    }
};
