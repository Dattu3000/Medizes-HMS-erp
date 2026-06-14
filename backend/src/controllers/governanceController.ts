import { Request, Response } from 'express';
import { WorkflowStatus } from '@prisma/client';
import { prisma } from '../utils/db';
import { contextStorage } from '../security/context';
import * as crypto from 'node:crypto';
import { computeInvoiceReferenceNumber, generateLocalDigitalSignature } from '../utils/eInvoiceSigner';

const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const MOCK_PRIVATE_KEY_PEM = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

interface ReviewActionBody {
  recordId: string;
  recordType: 'LEDGER' | 'DISBURSEMENT';
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}

/**
 * Handles the state machine transition for financial records following Maker-Checker protocols.
 * POST /api/v1/governance/review
 */
export async function processWorkflowAction(req: Request<{}, {}, ReviewActionBody>, res: Response) {
  const { recordId, recordType, action, rejectionReason } = req.body;
  
  // 1. Resolve reviewer footprint from the thread-safe AsyncLocalStorage context
  const currentContext = contextStorage.getStore();
  const reviewerId = currentContext?.userId;

  if (!reviewerId) {
    return res.status(401).json({ success: false, error: "Authentication context missing." });
  }

  try {
    // 2. Execute within an isolated ACID transaction block
    const result = await prisma.$transaction(async (tx) => {
      
      if (recordType === 'LEDGER') {
        // Fetch target record to validate current state and verify creator identity
        const record = await tx.ledger.findUnique({ where: { id: recordId } });
        
        if (!record) throw new Error("Target ledger transaction record not found.");
        if (record.workflowStatus !== WorkflowStatus.PENDING_APPROVAL) {
          throw new Error(`Invalid transition state. Record is currently: ${record.workflowStatus}`);
        }
        
        // ANTI-FRAUD GUARDRAIL: Prevent self-approval (Maker cannot act as Checker)
        if (record.createdByUserId === reviewerId) {
          throw new Error("Compliance Violation: The Maker of this transaction cannot act as its Checker.");
        }

        // Apply state transition
        if (action === 'APPROVE') {
          const approvedLedger = await tx.ledger.update({
            where: { id: recordId },
            data: {
              workflowStatus: WorkflowStatus.APPROVED,
              approvedByUserId: reviewerId,
              rejectionReason: null 
            }
          });

          // STATUTORY ENGINE CHECK: Execute E-Invoicing ONLY if row is legally TAXABLE
          if (approvedLedger.taxEligibilityStatus === 'TAXABLE') {
            
            // Calculate standard 64-character IRN hash value
            const irn = computeInvoiceReferenceNumber(
              '29AAAAA1111A1Z1', // Simulated Hospital Master GSTIN
              approvedLedger.id.substring(0, 8),
              '2026-27'
            );

            // Assemble the data contract payload
            const signPayload = {
              merchantGstin: '29AAAAA1111A1Z1',
              buyerGstin: '29BBBBB2222B2Z2',
              invoiceNumber: approvedLedger.id.substring(0, 8),
              invoiceDate: new Date(approvedLedger.createdAt).toISOString().split('T')[0],
              totalTaxableValue: Number(approvedLedger.baseAmount),
              totalGstAmount: Number(approvedLedger.baseAmount) * 0.18 // Base calculation fallback
            };

            // Generate asymmetry signature profile string
            const signature = generateLocalDigitalSignature(signPayload, MOCK_PRIVATE_KEY_PEM);
            const generatedAckNum = String(Math.floor(100000000000 + Math.random() * 900000000000));

            // Write into the EInvoiceRegistry table within the transaction context block
            await tx.eInvoiceRegistry.create({
              data: {
                ledgerId: approvedLedger.id,
                irn: irn,
                signedQrCode: `IRP_PORTAL_SIGNED_QR_METADATA_STREAM_ACK_${generatedAckNum}`,
                ackNumber: generatedAckNum,
                ackTimestamp: new Date(),
                digitalSignature: signature
              }
            });
          }

          return approvedLedger;
        } else {
          if (!rejectionReason) throw new Error("A rejection reason must be supplied.");
          return await tx.ledger.update({
            where: { id: recordId },
            data: {
              workflowStatus: WorkflowStatus.REJECTED,
              approvedByUserId: reviewerId,
              rejectionReason: rejectionReason
            }
          });
        }
      }

      if (recordType === 'DISBURSEMENT') {
        const record = await tx.disbursement.findUnique({ where: { id: recordId } });
        if (!record) throw new Error("Target disbursement transaction record not found.");
        if (record.workflowStatus !== WorkflowStatus.PENDING_APPROVAL) {
          throw new Error(`Invalid transition state. Record is currently: ${record.workflowStatus}`);
        }
        if (record.createdByUserId === reviewerId) {
          throw new Error("Compliance Violation: The Maker of this disbursement cannot act as its Checker.");
        }

        if (action === 'APPROVE') {
          return await tx.disbursement.update({
            where: { id: recordId },
            data: {
              workflowStatus: WorkflowStatus.APPROVED,
              approvedByUserId: reviewerId,
              rejectionReason: null
            }
          });
        } else {
          if (!rejectionReason) throw new Error("A rejection reason must be supplied.");
          return await tx.disbursement.update({
            where: { id: recordId },
            data: {
              workflowStatus: WorkflowStatus.REJECTED,
              approvedByUserId: reviewerId,
              rejectionReason: rejectionReason
            }
          });
        }
      }

      throw new Error("Unsupported record configuration target type.");
    });

    // 3. Return successfully mutated record state
    return res.status(200).json({
      success: true,
      message: `Record successfully moved to status: ${result.workflowStatus}`,
      data: result
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "An unexpected error occurred during workflow review processing."
    });
  }
}
