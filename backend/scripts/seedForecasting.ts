import { PrismaClient, TaxEligibilityStatus, WorkflowStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding dynamic intra-month sample data for forecasting...');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Set dates to within the current month, say the 5th and 10th
  const date1 = new Date(currentYear, currentMonth, 5);
  const date2 = new Date(currentYear, currentMonth, 10);

  // Clean existing sample forecasting ledgers if any
  await prisma.ledger.deleteMany({
    where: {
      name: { startsWith: 'FC_' }
    }
  });

  const sampleData = [
    {
      name: `FC_Exempt_Service_${Date.now()}_1`,
      group: 'Direct Income',
      balance: 100000,
      accountType: 'DETAIL',
      baseAmount: 100000,
      taxEligibilityStatus: TaxEligibilityStatus.EXEMPT,
      workflowStatus: WorkflowStatus.APPROVED,
      createdAt: date1,
      createdByUserId: '9f9588f1-1819-470f-b9f9-a08bd58ec0b9'
    },
    {
      name: `FC_Taxable_Service_${Date.now()}_2`,
      group: 'Direct Income',
      balance: 250000,
      accountType: 'DETAIL',
      baseAmount: 250000,
      taxEligibilityStatus: TaxEligibilityStatus.TAXABLE,
      workflowStatus: WorkflowStatus.APPROVED,
      createdAt: date2,
      createdByUserId: '9f9588f1-1819-470f-b9f9-a08bd58ec0b9'
    },
    {
      name: `FC_Admin_Overhead_${Date.now()}_3`,
      group: 'Indirect Expenses',
      balance: 50000,
      accountType: 'DETAIL',
      baseAmount: 50000,
      taxEligibilityStatus: TaxEligibilityStatus.TAXABLE,
      hsnSacCode: '999799', // Matches runningCommonCredit logic
      workflowStatus: WorkflowStatus.PENDING_APPROVAL,
      createdAt: date2,
      createdByUserId: '9f9588f1-1819-470f-b9f9-a08bd58ec0b9'
    }
  ];

  for (const data of sampleData) {
    await prisma.ledger.create({ data });
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
