import { Request, Response } from 'express';
import { executeGstReconciliation } from '../services/gstReconciliationService';

export const reconcileGst = async (req: Request, res: Response) => {
    try {
        const { returnPeriod } = req.params;

        if (!returnPeriod || isNaN(Number(returnPeriod))) {
            return res.status(400).json({ message: 'Valid return period (YYYYMM) is required' });
        }

        const results = await executeGstReconciliation(Number(returnPeriod));

        // Group the results by match_category for the dashboard
        const dashboardSummary = {
            EXACT_MATCH: 0,
            PARTIAL_MATCH_TAX_MISMATCH: 0,
            PARTIAL_MATCH_DATE_MISMATCH: 0,
            PR_ONLY_MISSING_IN_2B: 0,
            GSTR2B_ONLY_MISSING_IN_PR: 0,
            totalRowsProcessed: results.length
        };

        results.forEach(row => {
            if (row.match_category && dashboardSummary.hasOwnProperty(row.match_category)) {
                dashboardSummary[row.match_category as keyof typeof dashboardSummary]++;
            }
        });

        res.status(200).json({
            message: 'Reconciliation successful',
            summary: dashboardSummary,
            data: results.slice(0, 100) // Return only first 100 rows to avoid crashing frontend
        });
    } catch (error) {
        console.error('Reconciliation error:', error);
        res.status(500).json({ message: 'Internal server error during reconciliation', error });
    }
};

import { prisma } from '../utils/db';
import { syncGstr2bInvoices } from '../services/gstReconciliationService';

export const uploadPurchaseRegister = async (req: Request, res: Response) => {
    try {
        const { returnPeriod, receiverGstin } = req.body;
        if (!returnPeriod || isNaN(Number(returnPeriod))) {
            return res.status(400).json({ message: 'returnPeriod (YYYYMM) is required' });
        }
        const gstin = receiverGstin || '27AAAAA5555A1Z5';
        const period = Number(returnPeriod);

        // Delete existing PR invoices for this period
        await prisma.purchaseRegisterInvoice.deleteMany({
            where: {
                receiverGstin: gstin,
                returnPeriod: period
            }
        });

        const baseDate = new Date(
            Math.floor(period / 100), 
            (period % 100) - 1, 
            15
        );

        const prInvoices = [
            // 1. Exact match
            {
                receiverGstinId: '00000000-0000-0000-0000-000000000000',
                receiverGstin: gstin,
                supplierGstin: '27AAAAA1111A1Z1',
                invoiceNumber: 'INV-2026-001',
                sanitizedInvoiceNumber: 'INV2026001',
                invoiceDate: new Date(baseDate),
                returnPeriod: period,
                taxableValue: 100000.00,
                cgst: 9000.00,
                sgstUtgst: 9000.00,
                igst: 0.00,
                cess: 0.00,
                totalGst: 18000.00,
                costCenterCode: 'OPD',
                erpSource: 'HOSPITAL_ERP'
            },
            // 2. Tax Mismatch (PR has ₹9000 total GST, but GSTR-2B only has ₹6000 total GST)
            {
                receiverGstinId: '00000000-0000-0000-0000-000000000000',
                receiverGstin: gstin,
                supplierGstin: '27BBBBB2222B2Z2',
                invoiceNumber: 'TX-2026-042',
                sanitizedInvoiceNumber: 'TX2026042',
                invoiceDate: new Date(baseDate),
                returnPeriod: period,
                taxableValue: 50000.00,
                cgst: 4500.00,
                sgstUtgst: 4500.00,
                igst: 0.00,
                cess: 0.00,
                totalGst: 9000.00,
                costCenterCode: 'IPD',
                erpSource: 'HOSPITAL_ERP'
            },
            // 3. Date Mismatch (PR has invoice date + 2 days compared to GSTR-2B)
            {
                receiverGstinId: '00000000-0000-0000-0000-000000000000',
                receiverGstin: gstin,
                supplierGstin: '27CCCCC3333C3Z3',
                invoiceNumber: 'INV/INS/779',
                sanitizedInvoiceNumber: 'INVINS779',
                invoiceDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // Date mismatch
                returnPeriod: period,
                taxableValue: 150000.00,
                cgst: 13500.00,
                sgstUtgst: 13500.00,
                igst: 0.00,
                cess: 0.00,
                totalGst: 27000.00,
                costCenterCode: 'ADMIN',
                erpSource: 'HOSPITAL_ERP'
            },
            // 4. PR only (missing in GSTR-2B)
            {
                receiverGstinId: '00000000-0000-0000-0000-000000000000',
                receiverGstin: gstin,
                supplierGstin: '27EEEEE5555E5Z5',
                invoiceNumber: 'PR-ONLY-999',
                sanitizedInvoiceNumber: 'PRONLY999',
                invoiceDate: new Date(baseDate),
                returnPeriod: period,
                taxableValue: 80000.00,
                cgst: 7200.00,
                sgstUtgst: 7200.00,
                igst: 0.00,
                cess: 0.00,
                totalGst: 14400.00,
                costCenterCode: 'PHARMACY',
                erpSource: 'HOSPITAL_ERP'
            }
        ];

        for (const pr of prInvoices) {
            await prisma.purchaseRegisterInvoice.create({
                data: pr
            });
        }

        res.status(200).json({ message: 'Purchase register uploaded successfully', count: prInvoices.length });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to upload Purchase Register', error: error.message });
    }
};

export const uploadGstr2b = async (req: Request, res: Response) => {
    try {
        const { returnPeriod, receiverGstin } = req.body;
        if (!returnPeriod || isNaN(Number(returnPeriod))) {
            return res.status(400).json({ message: 'returnPeriod (YYYYMM) is required' });
        }
        const gstin = receiverGstin || '27AAAAA5555A1Z5';
        const synced = await syncGstr2bInvoices(gstin, Number(returnPeriod));
        res.status(200).json({ message: 'GSTR-2B synced successfully', count: synced.length, data: synced });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to sync GSTR-2B', error: error.message });
    }
};
