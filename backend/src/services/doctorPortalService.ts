import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TdsHistorySummary {
  panNumber: string;
  doctorName: string;
  financialYear: string;
  cumulativeGrossPaid: number;
  cumulativeTdsWithheld: number;
  thresholdReached: boolean;
  records: Array<{
    disbursementId: string;
    date: Date;
    grossAmount: number;
    tdsAmount: number;
    section: string;
  }>;
}

/**
 * Validates that a doctor exists within the system using their unique tax identifier PAN.
 */
export async function verifyDoctorByPan(panNumber: string) {
  return await prisma.vendor.findFirst({
    where: {
      panNumber: panNumber.toUpperCase().trim(),
      vendorSubType: 'INDIVIDUAL', // Ensures corporate suppliers cannot access the doctor portal
    },
    select: {
      id: true,
      name: true,
      panNumber: true,
    }
  });
}

/**
 * Executes a read-optimized projection query to fetch 194J history for a specific PAN.
 */
export async function getDoctorTdsHistory(panNumber: string, financialYear: string): Promise<TdsHistorySummary> {
  // Define fiscal boundaries for the requested tax year (e.g., "2026-27")
  const baseYear = parseInt(financialYear.split('-')[0]);
  const startDate = new Date(`${baseYear}-04-01T00:00:00Z`);
  const endDate = new Date(`${baseYear + 1}-03-31T23:59:59Z`);

  // 1. Locate the doctor record
  const doctor = await prisma.vendor.findFirst({
    where: { panNumber: panNumber.toUpperCase().trim() }
  });

  if (!doctor) {
    throw new Error("No practitioner profile found matching the provided PAN record.");
  }

  // 2. Query disbursements using explicit field selection for database optimization
  const dataRecords = await prisma.disbursement.findMany({
    where: {
      vendorId: doctor.id,
      tdsSection: 'SEC_194J', // Filter strictly for professional consultant tax headers
      createdAt: { gte: startDate, lte: endDate },
      workflowStatus: 'APPROVED' // Statutory rule: Exclude pending/draft entries
    },
    select: {
      id: true,
      grossAmount: true,
      tdsAmount: true,
      tdsSection: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Compute running totals for real-time tracking
  let cumulativeGrossPaid = 0;
  let cumulativeTdsWithheld = 0;

  const formattedRecords = dataRecords.map(rec => {
    const gross = Number(rec.grossAmount);
    const tds = Number(rec.tdsAmount);
    
    cumulativeGrossPaid += gross;
    cumulativeTdsWithheld += tds;

    return {
      disbursementId: rec.id,
      date: rec.createdAt,
      grossAmount: gross,
      tdsAmount: tds,
      section: rec.tdsSection!
    };
  });

  return {
    panNumber: doctor.panNumber!,
    doctorName: doctor.name,
    financialYear,
    cumulativeGrossPaid,
    cumulativeTdsWithheld,
    thresholdReached: cumulativeGrossPaid >= 30000, // Section 194J threshold indicator
    records: formattedRecords
  };
}
