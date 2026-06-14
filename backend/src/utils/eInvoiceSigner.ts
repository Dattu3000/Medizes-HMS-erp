import * as crypto from 'node:crypto';

interface EInvoicePayload {
  merchantGstin: string;
  buyerGstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalTaxableValue: number;
  totalGstAmount: number;
}

/**
 * Simulates localized PKI/X.509 cryptographic signing of the invoice string payload.
 * In production, this interacts with a physical HSM or an SSL/TLS token certificate.
 */
export function generateLocalDigitalSignature(payload: EInvoicePayload, privateKeyPem: string): string {
  const targetDataString = JSON.stringify(payload);
  
  const signer = crypto.createSign('SHA256');
  signer.update(targetDataString);
  signer.end();

  // Generate a base64 encoded signature stream
  return signer.sign(privateKeyPem, 'base64');
}

/**
 * Computes the mandatory 64-character unique hex string (IRN) using a SHA-256 hashing algorithm.
 * Formula: SHA256(SupplierGSTIN + InvoiceNum + FinancialYear + DocType)
 */
export function computeInvoiceReferenceNumber(supplierGstin: string, docNum: string, fiscalYear: string): string {
  const structuralSeed = `${supplierGstin.toUpperCase()}:${docNum.toUpperCase()}:${fiscalYear}:INV`;
  return crypto.createHash('sha256').update(structuralSeed).digest('hex');
}
