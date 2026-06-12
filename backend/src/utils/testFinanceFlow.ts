import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1. Create a Vendor
    const vendor = await prisma.vendor.upsert({
        where: { panNumber: 'ABCDE1234F' },
        update: {},
        create: {
            name: 'Astra Biotech Services Pvt Ltd',
            panNumber: 'ABCDE1234F',
            vendorSubType: 'CORPORATE',
            gstNumber: '27AAAAA1111A1Z1',
        }
    });

    const vendor2 = await prisma.vendor.upsert({
        where: { panNumber: 'GHIJK5678L' },
        update: {},
        create: {
            name: 'Dr. John Doe (Consultant)',
            panNumber: 'GHIJK5678L',
            vendorSubType: 'SINGLE_PRACTITIONER',
            gstNumber: '27BBBBB2222B2Z2',
        }
    });

    // Create a Ledger
    const ledger = await prisma.ledger.upsert({
        where: { name: 'Professional Fees' },
        update: {},
        create: {
            code: 'LED-TEST-001',
            name: 'Professional Fees',
            group: 'EXPENSE',
            isActive: true
        }
    });

    // Create Transactions
    const transaction = await prisma.transaction.create({
        data: {
            ledgerId: ledger.id,
            type: 'DEBIT',
            amount: 50000.00,
            description: 'Professional fees payment'
        }
    });

    const transaction2 = await prisma.transaction.create({
        data: {
            ledgerId: ledger.id,
            type: 'DEBIT',
            amount: 100000.00,
            description: 'Corporate consultant payout'
        }
    });

    // Create Disbursements
    await prisma.disbursement.create({
        data: {
            transactionId: transaction.id,
            vendorId: vendor2.id,
            grossAmount: 50000.00,
            tdsApplicable: true,
            tdsSection: '194J',
            tdsAmount: 5000.00,
            netPayout: 45000.00,
            createdAt: new Date('2026-06-10T10:00:00Z')
        }
    });

    await prisma.disbursement.create({
        data: {
            transactionId: transaction2.id,
            vendorId: vendor.id,
            grossAmount: 100000.00,
            tdsApplicable: true,
            tdsSection: '194J',
            tdsAmount: 10000.00,
            netPayout: 90000.00,
            createdAt: new Date('2026-06-12T14:30:00Z')
        }
    });

    // Create TaxPayableSummary
    await prisma.taxPayableSummary.upsert({
        where: { month_year: { month: 6, year: 2026 } },
        update: {},
        create: {
            month: 6,
            year: 2026,
            totalITC: 75000.00,
            t1: 5000.00,
            t2: 10000.00,
            t3: 5000.00,
            c1: 55000.00,
            c2: 25000.00,
            exemptRevenue: 100000.00,
            totalTurnover: 500000.00,
            reversalD1: 15000.00,
            netItcAvailable: 40000.00,
        }
    });

    console.log('Finance test data seeded successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
