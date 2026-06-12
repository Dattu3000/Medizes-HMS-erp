import { prisma } from '../utils/db';

export const generateGstr3bJson = async (returnPeriod: number) => {
    try {
        console.log(`[EXPORT SERVICE] Generating GSTR-3B JSON for return period ${returnPeriod}`);
        
        const month = returnPeriod % 100;
        const year = Math.floor(returnPeriod / 100);

        // Fetch Rule 42 apportionment details for this period
        const summary = await prisma.taxPayableSummary.findUnique({
            where: {
                month_year: { month, year }
            }
        });

        const reversalD1 = summary?.reversalD1 || 0.00;
        const cgstReversed = Number((reversalD1 / 2).toFixed(2));
        const sgstReversed = Number((reversalD1 / 2).toFixed(2));

        // Format the return period to GSTN offline tool format (MMYYYY)
        const formattedPeriod = `${String(month).padStart(2, '0')}${year}`;

        const gstr3bPayload = {
            gstin: '27AAAAA5555A1Z5',
            ret_period: formattedPeriod,
            filing_typ: 'GSTR3B',
            itc_elg: {
                itc_avl: [
                    {
                        ty: 'IMPG',
                        cgst: 0.00,
                        sgst: 0.00,
                        igst: summary?.totalITC || 0.00,
                        cess: 0.00
                    }
                ],
                itc_rev: [
                    {
                        ty: 'RULE_42_43',
                        cgst: cgstReversed,
                        sgst: sgstReversed,
                        igst: 0.00,
                        cess: 0.00
                    }
                ],
                itc_net: {
                    cgst: -cgstReversed,
                    sgst: -sgstReversed,
                    igst: summary?.totalITC || 0.00,
                    cess: 0.00
                }
            }
        };

        return JSON.stringify(gstr3bPayload, null, 2);
    } catch (error) {
        console.error('[EXPORT SERVICE] GSTR-3B JSON generation failed:', error);
        throw error;
    }
};

export const generateTds26qText = async (returnPeriod: number) => {
    try {
        console.log(`[EXPORT SERVICE] Compiling NSDL Form 26Q e-TDS return for return period ${returnPeriod}`);

        const month = returnPeriod % 100;
        const year = Math.floor(returnPeriod / 100);

        // Date range for the return period
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Fetch disbursements with active TDS
        const disbursements = await prisma.disbursement.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                tdsApplicable: true
            },
            include: {
                vendor: true
            }
        });

        // NSDL formatting constraints:
        // Caret (^) delimited columns, carriage-return + newline (\r\n) line endings.
        const lines: string[] = [];

        // 1. File Header (FH)
        // Record Type ^ Upload Type ^ File Serial No ^ Deductor PAN
        lines.push(`FH^SL^1^PAN2026001`);

        // 2. Batch Header (BH)
        // Record Type ^ Form Type ^ Return Period ^ Deductor Name ^ Deductor Address
        lines.push(`BH^26Q^${String(month).padStart(2, '0')}${year}^MEDISYS HOSPITAL CORP^MUMBAI MAHARASHTRA`);

        // 3. Deductee Detail Records (CD)
        // Record Type ^ Line No ^ Deductee Code ^ Deductee PAN ^ Deductee Name ^ Payment Date ^ Amount Paid ^ TDS Amount ^ Section Code
        disbursements.forEach((d, index) => {
            const lineNo = index + 1;
            const deducteeCode = d.vendor.vendorSubType === 'CORPORATE' ? '01' : '02'; // 01 for Company, 02 for others
            const pan = d.vendor.panNumber || 'PANREQUIRED';
            const name = d.vendor.name.toUpperCase();
            const dateStr = d.createdAt.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
            const gross = d.grossAmount.toFixed(2);
            const tds = d.tdsAmount.toFixed(2);
            const section = d.tdsSection || '194J';

            lines.push(`CD^${lineNo}^${deducteeCode}^${pan}^${name}^${dateStr}^${gross}^${tds}^${section}`);
        });

        // Join lines with strict \r\n carriage-returns as required by the government validation utility (FVU)
        return lines.join('\r\n') + '\r\n';
    } catch (error) {
        console.error('[EXPORT SERVICE] NSDL Form 26Q generation failed:', error);
        throw error;
    }
};
