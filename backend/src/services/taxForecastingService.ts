import { PrismaClient, TaxEligibilityStatus, WorkflowStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TaxForecastResult {
  currentDay: number;
  totalDaysInMonth: number;
  extrapolationFactor: number;
  predictedExemptRevenue_E: number;
  predictedTotalTurnover_F: number;
  predictedCommonCredit_C2: number;
  predictedReversal_D1: number;
  estimatedGstCashObligation: number;
  treasuryAlertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export async function generateMidMonthTaxForecast(year: number, month: number): Promise<TaxForecastResult> {
  // 1. Resolve calendar day metrics for time-velocity forecasting
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  let currentDay = today.getDate();

  // If querying a past historical month, lock the day execution state to month-end max
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    currentDay = totalDaysInMonth;
  }

  const extrapolationFactor = totalDaysInMonth / currentDay;

  // 2. Define the intra-month date boundary criteria
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  // 3. Query the database for mid-month run-rate metrics
  // Include both APPROVED and PENDING_APPROVAL lines to forecast maximum exposure
  const activeLedgerEntries = await prisma.ledger.findMany({
    where: {
      createdAt: { gte: startOfMonth, lte: endOfMonth },
      workflowStatus: { in: [WorkflowStatus.APPROVED, WorkflowStatus.PENDING_APPROVAL] }
    }
  });

  let runningExemptRevenue = 0;
  let runningTaxableRevenue = 0;
  let runningCommonCredit = 0;
  let runningOutputGst = 0;

  for (const entry of activeLedgerEntries) {
    const amount = Number(entry.baseAmount);
    
    // Distinguish operational cost centers using accounting tags
    if (entry.taxEligibilityStatus === TaxEligibilityStatus.EXEMPT) {
      runningExemptRevenue += amount;
    } else if (entry.taxEligibilityStatus === TaxEligibilityStatus.TAXABLE) {
      runningTaxableRevenue += amount;
      // Synthetically derive output tax for velocity tracking (assuming 12% average)
      runningOutputGst += amount * 0.12; 
    }

    // Capture shared corporate/hospital operational overheads
    if (entry.hsnSacCode === '999799' || entry.costCenterId === 'cc_central_admin') {
      runningCommonCredit += amount * 0.18; // Standard 18% input pool tracking
    }
  }

  const runningTotalTurnover = runningExemptRevenue + runningTaxableRevenue;

  // 4. Run time-velocity formulas to generate predictions
  const predictedExemptRevenue_E = runningExemptRevenue * extrapolationFactor;
  const predictedTotalTurnover_F = runningTotalTurnover * extrapolationFactor;
  const predictedCommonCredit_C2 = runningCommonCredit * extrapolationFactor;

  // Apply the Rule 42 dynamic reversal equation
  let predictedReversal_D1 = 0;
  if (predictedTotalTurnover_F > 0) {
    predictedReversal_D1 = (predictedExemptRevenue_E / predictedTotalTurnover_F) * predictedCommonCredit_C2;
  }

  // Calculate liquidity cash requirements (Output Tax Liability + Blocked ITC Reversal)
  const predictedOutputGst = runningOutputGst * extrapolationFactor;
  const estimatedGstCashObligation = predictedOutputGst + predictedReversal_D1;

  // 5. Establish threshold alarms based on liability scale
  let treasuryAlertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
  if (estimatedGstCashObligation > 500000) treasuryAlertLevel = 'CRITICAL'; // Above ₹5 Lakhs
  else if (estimatedGstCashObligation > 200000) treasuryAlertLevel = 'WARNING'; // Above ₹2 Lakhs

  return {
    currentDay,
    totalDaysInMonth,
    extrapolationFactor,
    predictedExemptRevenue_E: Math.round(predictedExemptRevenue_E),
    predictedTotalTurnover_F: Math.round(predictedTotalTurnover_F),
    predictedCommonCredit_C2: Math.round(predictedCommonCredit_C2),
    predictedReversal_D1: Math.round(predictedReversal_D1),
    estimatedGstCashObligation: Math.round(estimatedGstCashObligation),
    treasuryAlertLevel
  };
}
