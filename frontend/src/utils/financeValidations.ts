import { z } from 'zod';

// Form validation schema executing client-side data enforcement
export const ledgerEntrySchema = z.object({
  costCenterType: z.enum(['PHARMACY', 'OPD', 'IPD', 'ADMIN']),
  taxEligibilityStatus: z.enum(['EXEMPT', 'TAXABLE', 'PARTIAL_REVERSAL']),
  hsnSacCode: z.string().min(6).max(8).optional().or(z.literal('')),
  baseAmount: z.number().positive(),
}).refine((data) => {
  // Client-side execution of the specialized PRD Pharmacy Guard Rule
  if (data.costCenterType === 'PHARMACY' && data.taxEligibilityStatus === 'EXEMPT') {
    return false; 
  }
  return true;
}, {
  message: "Statutory Violation: Pharmacy transactions cannot carry an EXEMPT classification.",
  path: ["taxEligibilityStatus"]
});
