import { Decimal } from '@prisma/client/runtime/library';

export interface Gstr2bInvoicePayload {
    receiverGstin: string;
    supplierGstin: string;
    supplierLegalName: string;
    invoiceNumber: string;
    invoiceDate: Date;
    invoiceType: string;
    returnPeriod: number;
    gstr1FilingDate: Date;
    itcAvailability: 'AVAILABLE' | 'UNAVAILABLE';
    itcReversalReason: string | null;
    taxableValue: number;
    cgst: number;
    sgstUtgst: number;
    igst: number;
    cess: number;
}

export abstract class AbstractTaxGateway {
    abstract fetchGstr2bInvoices(receiverGstin: string, returnPeriod: number): Promise<Gstr2bInvoicePayload[]>;
}

export class ProductionTaxGateway extends AbstractTaxGateway {
    async fetchGstr2bInvoices(receiverGstin: string, returnPeriod: number): Promise<Gstr2bInvoicePayload[]> {
        // In production, this would make an HTTPS request to GSTN / GSP sandbox/production APIs.
        throw new Error('Production GSTN Gateway integration is not configured. Enable USE_SANDBOX_MOCKS=true for testing.');
    }
}

export class MockTaxGateway extends AbstractTaxGateway {
    async fetchGstr2bInvoices(receiverGstin: string, returnPeriod: number): Promise<Gstr2bInvoicePayload[]> {
        console.log(`[MOCK GATEWAY] Generating synthetic GSTN GSTR-2B payloads for ${receiverGstin} / ${returnPeriod}`);
        
        // Generate mock data mimicking standard GSTN structures
        const mockSuppliers = [
            { gstin: '27AAAAA1111A1Z1', name: 'Astra Biotech Services Pvt Ltd' },
            { gstin: '27BBBBB2222B2Z2', name: 'Max Pharma Solutions' },
            { gstin: '27CCCCC3333C3Z3', name: 'MediShield Insurance Corp' },
            { gstin: '27DDDDD4444D4Z4', name: 'Medica Equipment Labs' },
            { gstin: '27EEEEE5555E5Z5', name: 'LifeCare Consumables Ltd' }
        ];

        const invoices: Gstr2bInvoicePayload[] = [];
        const baseDate = new Date(
            Math.floor(returnPeriod / 100), 
            (returnPeriod % 100) - 1, 
            15
        );

        // 1. Exact Match case: invoice in both registers matches perfectly
        invoices.push({
            receiverGstin,
            supplierGstin: mockSuppliers[0].gstin,
            supplierLegalName: mockSuppliers[0].name,
            invoiceNumber: 'INV-2026-001',
            invoiceDate: new Date(baseDate),
            invoiceType: 'B2B',
            returnPeriod,
            gstr1FilingDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
            itcAvailability: 'AVAILABLE',
            itcReversalReason: null,
            taxableValue: 100000.00,
            cgst: 9000.00,
            sgstUtgst: 9000.00,
            igst: 0.00,
            cess: 0.00
        });

        // 2. Tax Mismatch case: invoice exists in both but GST amounts differ
        // Vendor files 12% instead of 18% or vice versa
        invoices.push({
            receiverGstin,
            supplierGstin: mockSuppliers[1].gstin,
            supplierLegalName: mockSuppliers[1].name,
            invoiceNumber: 'TX-2026-042',
            invoiceDate: new Date(baseDate),
            invoiceType: 'B2B',
            returnPeriod,
            gstr1FilingDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
            itcAvailability: 'AVAILABLE',
            itcReversalReason: null,
            taxableValue: 50000.00,
            cgst: 3000.00, // Vendor files ₹3000 CGST
            sgstUtgst: 3000.00, // Vendor files ₹3000 SGST (Total GST ₹6000)
            igst: 0.00,
            cess: 0.00
        });

        // 3. Date Mismatch case: invoice matches by number but dates differ
        invoices.push({
            receiverGstin,
            supplierGstin: mockSuppliers[2].gstin,
            supplierLegalName: mockSuppliers[2].name,
            invoiceNumber: 'INV/INS/779',
            invoiceDate: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), // Two days earlier
            invoiceType: 'B2B',
            returnPeriod,
            gstr1FilingDate: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
            itcAvailability: 'AVAILABLE',
            itcReversalReason: null,
            taxableValue: 150000.00,
            cgst: 13500.00,
            sgstUtgst: 13500.00,
            igst: 0.00,
            cess: 0.00
        });

        // 4. Missing in PR case: Vendor filed but hospital hasn't booked it yet
        invoices.push({
            receiverGstin,
            supplierGstin: mockSuppliers[3].gstin,
            supplierLegalName: mockSuppliers[3].name,
            invoiceNumber: 'EQ-88902',
            invoiceDate: new Date(baseDate),
            invoiceType: 'B2B',
            returnPeriod,
            gstr1FilingDate: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
            itcAvailability: 'AVAILABLE',
            itcReversalReason: null,
            taxableValue: 200000.00,
            cgst: 18000.00,
            sgstUtgst: 18000.00,
            igst: 0.00,
            cess: 0.00
        });

        // 5. Ineligible Credit / Reversal Case: blocked under Sec 17(5)
        invoices.push({
            receiverGstin,
            supplierGstin: mockSuppliers[4].gstin,
            supplierLegalName: mockSuppliers[4].name,
            invoiceNumber: 'CATER-902',
            invoiceDate: new Date(baseDate),
            invoiceType: 'B2B',
            returnPeriod,
            gstr1FilingDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            itcAvailability: 'UNAVAILABLE',
            itcReversalReason: 'BLOCKED_CREDIT_SEC_17_5',
            taxableValue: 25000.00,
            cgst: 2250.00,
            sgstUtgst: 2250.00,
            igst: 0.00,
            cess: 0.00
        });

        return invoices;
    }
}

export const getTaxGateway = (): AbstractTaxGateway => {
    const useMocks = process.env.USE_SANDBOX_MOCKS === 'true';
    if (useMocks) {
        return new MockTaxGateway();
    }
    return new ProductionTaxGateway();
};
