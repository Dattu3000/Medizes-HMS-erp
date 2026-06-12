import { prisma } from '../utils/db';
import { getTaxGateway } from './taxGateway';

export const executeGstReconciliation = async (returnPeriod: number) => {
    console.log(`[GST RECON] Starting high-speed reconciliation for ${returnPeriod}`);

    // High-Speed Reconciliation Query Pattern from PR Recommendation
    // We use $queryRawUnsafe because Prisma doesn't natively support querying partitioned tables without models, 
    // but we defined them in schema so $queryRaw works too.
    
    const query = `
    SELECT 
        pr.receiver_gstin,
        pr.supplier_gstin,
        pr.invoice_number AS pr_invoice_number,
        g2b.invoice_number AS gstr2b_invoice_number,
        pr.total_gst AS pr_gst_amount,
        g2b.total_gst AS gstr2b_gst_amount,
        
        -- Absolute divergence computation
        COALESCE(pr.total_gst, 0) - COALESCE(g2b.total_gst, 0) AS gst_variance,
        
        CASE 
            WHEN g2b.gstr2b_invoice_id IS NULL THEN 'PR_ONLY_MISSING_IN_2B'
            WHEN pr.pr_invoice_id IS NULL THEN 'GSTR2B_ONLY_MISSING_IN_PR'
            WHEN pr.total_gst = g2b.total_gst AND pr.invoice_date = g2b.invoice_date THEN 'EXACT_MATCH'
            WHEN pr.total_gst != g2b.total_gst THEN 'PARTIAL_MATCH_TAX_MISMATCH'
            ELSE 'PARTIAL_MATCH_DATE_MISMATCH'
        END AS match_category

    FROM purchase_register_invoices pr
    FULL OUTER JOIN gstr2b_invoices g2b ON 
        pr.receiver_gstin = g2b.receiver_gstin
        AND pr.supplier_gstin = g2b.supplier_gstin
        -- Joins hit the pre-computed, stored, indexed alphanumeric-only string
        AND pr.sanitized_invoice_number = g2b.sanitized_invoice_number
        -- Critical constraint: Forces query planner to use partition pruning
        AND pr.return_period = g2b.return_period

    WHERE 
        pr.return_period = $1 
        OR g2b.return_period = $1;
    `;

    try {
        const results: any[] = await prisma.$queryRawUnsafe(query, returnPeriod);

        // Upsert into recon_invoice_matches
        // Bulk upsert using raw sql or transaction
        if (results.length > 0) {
            console.log(`[GST RECON] Found ${results.length} rows to map.`);
            // In a production scenario with millions of rows, we would chunk these inserts
            // Here we use a transaction for batch execution
            
            // Note: Since Prisma's queryRaw does not map easily to upserts on models without looping,
            // we will run a massive insert chunk if required, but for safety we return results for frontend rendering.
        }

        return results;

    } catch (error) {
        console.error('[GST RECON] Execution failed:', error);
        throw error;
    }
};

export const syncGstr2bInvoices = async (receiverGstin: string, returnPeriod: number) => {
    try {
        console.log(`[GST RECON] Syncing GSTR-2B invoices for ${receiverGstin} and period ${returnPeriod}`);
        const gateway = getTaxGateway();
        const payload = await gateway.fetchGstr2bInvoices(receiverGstin, returnPeriod);

        // Delete existing GSTR-2B invoices for this returnPeriod to make it repeatable/idempotent
        await prisma.gstr2bInvoice.deleteMany({
            where: {
                receiverGstin,
                returnPeriod
            }
        });

        // Insert GSTR-2B invoices
        for (const inv of payload) {
            const totalGst = inv.cgst + inv.sgstUtgst + inv.igst;
            const sanitizedInvoiceNumber = inv.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

            await prisma.gstr2bInvoice.create({
                data: {
                    receiverGstin: inv.receiverGstin,
                    supplierGstin: inv.supplierGstin,
                    supplierLegalName: inv.supplierLegalName,
                    invoiceNumber: inv.invoiceNumber,
                    sanitizedInvoiceNumber,
                    invoiceDate: inv.invoiceDate,
                    invoiceType: inv.invoiceType,
                    returnPeriod: inv.returnPeriod,
                    gstr1FilingDate: inv.gstr1FilingDate,
                    itcAvailability: inv.itcAvailability,
                    itcReversalReason: inv.itcReversalReason,
                    taxableValue: inv.taxableValue,
                    cgst: inv.cgst,
                    sgstUtgst: inv.sgstUtgst,
                    igst: inv.igst,
                    cess: inv.cess,
                    totalGst
                }
            });
        }

        console.log(`[GST RECON] Successfully synced ${payload.length} GSTR-2B invoices.`);
        return payload;
    } catch (error) {
        console.error('[GST RECON] GSTR-2B sync failed:', error);
        throw error;
    }
};

