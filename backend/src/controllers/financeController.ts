import { Request, Response } from 'express';
import { prisma } from '../utils/db';

export const postTransaction = async (req: Request, res: Response) => {
    try {
        const { transaction_id, cost_center_id, line_items, disbursements } = req.body;

        // Fetch cost center to check type
        const costCenter = await prisma.costCenter.findUnique({
            where: { id: cost_center_id }
        });

        if (!costCenter) {
            return res.status(404).json({ message: 'Cost center not found' });
        }

        // Validate line items
        if (line_items && Array.isArray(line_items)) {
            for (const item of line_items) {
                // HSN/SAC Validation
                if (item.hsn_code && (item.hsn_code.length < 6 || item.hsn_code.length > 8)) {
                    return res.status(400).json({ message: `Invalid HSN/SAC code structure for item ${item.item_id}. Must be 6-8 digits.` });
                }

                // Pharmacy tax rule validation
                if (costCenter.type === 'PHARMACY' && item.is_exempt === true) {
                    return res.status(400).json({ message: 'Pharmacy transactions cannot be exempt from tax.' });
                }
            }
        }

        // Two-phase commit using interactive transaction
        const result = await prisma.$transaction(async (tx) => {
            let totalLedgerAmount = 0;

            if (line_items) {
                totalLedgerAmount = line_items.reduce((acc: number, item: any) => acc + item.base_amount + (item.base_amount * (item.gst_rate_percentage / 100)), 0);
            }

            // Create main transaction
            // We need a dummy ledger for these external API inputs if not provided.
            // Let's assume we find or create an 'API Integration Ledger'
            const apiLedger = await tx.ledger.upsert({
                where: { name: 'External Integrations A/c' },
                update: {},
                create: { name: 'External Integrations A/c', group: 'ASSET', accountType: 'DETAIL' }
            });

            const transaction = await tx.transaction.create({
                data: {
                    ledgerId: apiLedger.id,
                    type: 'CREDIT',
                    amount: totalLedgerAmount,
                    description: `External sync: ${transaction_id}`
                }
            });

            const processedDisbursements = [];

            if (disbursements && Array.isArray(disbursements)) {
                for (const disb of disbursements) {
                    let tdsAmount = 0;
                    const gross = disb.gross_payout_amount;
                    let vendor = await tx.vendor.findUnique({ where: { panNumber: disb.payee_id } });

                    if (!vendor) {
                        vendor = await tx.vendor.create({
                            data: {
                                name: `Vendor ${disb.payee_id}`,
                                panNumber: disb.payee_id,
                                vendorSubType: 'CORPORATE' // Default
                            }
                        });
                    }

                    if (disb.tds_applicable && disb.tds_section === '194J') {
                        // Check cumulative payout for current FY
                        // Simplified financial year check (assuming April 1st start)
                        const now = new Date();
                        const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                        const startOfFy = new Date(currentYear, 3, 1);
                        const endOfFy = new Date(currentYear + 1, 2, 31, 23, 59, 59);

                        const previousDisbursements = await tx.disbursement.findMany({
                            where: {
                                vendorId: vendor.id,
                                createdAt: { gte: startOfFy, lte: endOfFy }
                            }
                        });

                        const cumulativePayout = previousDisbursements.reduce((acc: number, d: any) => acc + d.grossAmount, 0);

                        if (cumulativePayout + gross > 30000) {
                            // Apply TDS
                            const rate = vendor.vendorSubType === 'SINGLE_PRACTITIONER' ? 0.02 : 0.10;
                            tdsAmount = gross * rate;
                        }
                    }

                    const netPayout = gross - tdsAmount;

                    const disbursementRecord = await tx.disbursement.create({
                        data: {
                            transactionId: transaction.id,
                            vendorId: vendor.id,
                            grossAmount: gross,
                            tdsApplicable: disb.tds_applicable,
                            tdsSection: disb.tds_section,
                            tdsAmount: tdsAmount,
                            netPayout: netPayout
                        }
                    });

                    processedDisbursements.push(disbursementRecord);
                }
            }

            return { transaction, processedDisbursements };
        });

        res.status(201).json({ message: 'Transaction processed successfully', data: result });
    } catch (error) {
        console.error('Transaction Error:', error);
        res.status(500).json({ message: 'Internal server error processing transaction', error });
    }
};
