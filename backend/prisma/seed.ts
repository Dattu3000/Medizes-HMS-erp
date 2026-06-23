import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminRole = await prisma.role.upsert({
        where: { name: 'Super Admin' },
        update: {},
        create: {
            name: 'Super Admin',
            permissions: ['*'],
        },
    });

    const mainBranch = await prisma.branch.create({
        data: {
            name: 'Medisys Main Hospital',
            location: 'New York, NY',
        },
    });

    const passwordHash = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.user.upsert({
        where: { employeeId: 'EMP-0000-ADMIN' },
        update: {},
        create: {
            employeeId: 'EMP-0000-ADMIN',
            email: 'admin@medisyshms.com',
            passwordHash,
            roleId: adminRole.id,
            branchId: mainBranch.id,
            otpEnabled: false,
            employee: {
                create: {
                    firstName: 'System',
                    lastName: 'Administrator',
                    department: 'Management',
                    designation: 'Super Admin'
                }
            }
        },
    });

    const doctorRole = await prisma.role.upsert({
        where: { name: 'Doctor' },
        update: {},
        create: { name: 'Doctor', permissions: ['OPD_VIEW'] }
    });

    const drAccount = await prisma.user.upsert({
        where: { employeeId: 'EMP-0001-DOC' },
        update: {},
        create: {
            employeeId: 'EMP-0001-DOC',
            email: 'dr.smith@medisyshms.com',
            passwordHash,
            roleId: doctorRole.id,
            branchId: mainBranch.id,
            otpEnabled: false,
            employee: {
                create: {
                    firstName: 'John',
                    lastName: 'Smith',
                    department: 'Cardiology',
                    designation: 'Doctor'
                }
            }
        }
    });

    // LAYER 2: Seed Wards and Beds
    const generalWard = await prisma.ward.upsert({
        where: { id: 'ward-general-01' },
        update: {},
        create: {
            id: 'ward-general-01',
            name: 'General Male Ward',
            type: 'GENERAL',
            capacity: 5
        }
    });

    const icuWard = await prisma.ward.upsert({
        where: { id: 'ward-icu-01' },
        update: {},
        create: {
            id: 'ward-icu-01',
            name: 'Intensive Care Unit (ICU)',
            type: 'ICU',
            capacity: 2
        }
    });

    // Create beds for general ward
    for (let i = 1; i <= generalWard.capacity; i++) {
        await prisma.bed.upsert({
            where: { id: `bed-gen-${i}` },
            update: {},
            create: {
                id: `bed-gen-${i}`,
                bedNumber: `GEN-${i}`,
                wardId: generalWard.id,
                dailyRent: 1500, // 1500 Rs per day
                status: 'AVAILABLE'
            }
        });
    }

    // Create beds for ICU ward
    for (let i = 1; i <= icuWard.capacity; i++) {
        await prisma.bed.upsert({
            where: { id: `bed-icu-${i}` },
            update: {},
            create: {
                id: `bed-icu-${i}`,
                bedNumber: `ICU-${i}`,
                wardId: icuWard.id,
                dailyRent: 8000,
                status: 'AVAILABLE'
            }
        });
    }

    // LAYER 3: Seed Lab Tests & Pharmacy Inventory
    await prisma.labCatalog.upsert({
        where: { testName: 'Complete Blood Count (CBC)' },
        update: {},
        create: { testName: 'Complete Blood Count (CBC)', department: 'Hematology', price: 450 }
    });

    await prisma.labCatalog.upsert({
        where: { testName: 'Lipid Profile' },
        update: {},
        create: { testName: 'Lipid Profile', department: 'Biochemistry', price: 800 }
    });

    await prisma.medicineInventory.upsert({
        where: { drugName: 'Paracetamol 500mg' },
        update: {},
        create: { drugName: 'Paracetamol 500mg', manufacturer: 'GSK', batchNo: 'B-1001', expiryDate: new Date('2028-01-01'), stockQuantity: 5000, unitPrice: 2.5 }
    });

    await prisma.medicineInventory.upsert({
        where: { drugName: 'Amoxicillin 500mg' },
        update: {},
        create: { drugName: 'Amoxicillin 500mg', manufacturer: 'Cipla', batchNo: 'A-2005', expiryDate: new Date('2027-06-01'), stockQuantity: 2000, unitPrice: 8.0 }
    });

    console.log('🌱 Initiating Enterprise HMS Database Seeding (Statutory & Test Data)...');

    // 1. Core Maker & Checker ID Constants
    const makerUserId = 'USR_MAKER_001';
    const checkerUserId = 'USR_CHECKER_002';

    // 2. Vendors & Doctors (TDS Tracking)
    console.log('⏳ Seeding Vendors & Medical Consultants...');
    const drAnanya = await prisma.vendor.upsert({
        where: { panNumber: 'ABCDE1234F' },
        update: {},
        create: {
            panNumber: 'ABCDE1234F',
            name: 'Dr. Ananya Rao',
            vendorSubType: 'INDIVIDUAL',
        },
    });

    const pharmaSupplier = await prisma.vendor.upsert({
        where: { panNumber: 'PHARM9876S' },
        update: {},
        create: {
            panNumber: 'PHARM9876S',
            name: 'Vasan Medical Supplies Ltd',
            vendorSubType: 'COMPANY',
        },
    });

    // 3. Cost Centers (Ledger Constraints)
    console.log('⏳ Seeding Cost Centers...');
    await prisma.costCenter.upsert({
        where: { id: 'IPD_SURGERY' },
        update: {},
        create: { id: 'IPD_SURGERY', name: 'IPD Surgery Cost Center', type: 'IPD' }
    });
    await prisma.costCenter.upsert({
        where: { id: 'PHARMACY' },
        update: {},
        create: { id: 'PHARMACY', name: 'Pharmacy Cost Center', type: 'PHARMACY' }
    });
    await prisma.costCenter.upsert({
        where: { id: 'OPD_CONSULT' },
        update: {},
        create: { id: 'OPD_CONSULT', name: 'OPD Consultation Cost Center', type: 'OPD' }
    });
    await prisma.costCenter.upsert({
        where: { id: 'CENTRAL_OPS' },
        update: {},
        create: { id: 'CENTRAL_OPS', name: 'Central Operations Cost Center', type: 'ADMIN' }
    });

    // 4. Seeding Ledgers for disbursements
    const drProfessionalLedger = await prisma.ledger.upsert({
        where: { name: 'Dr. Ananya Professional Fees' },
        update: {},
        create: {
            name: 'Dr. Ananya Professional Fees',
            group: 'Expenses',
            balance: 0.00,
            taxEligibilityStatus: 'EXEMPT',
            workflowStatus: 'APPROVED',
            createdByUserId: makerUserId,
            approvedByUserId: checkerUserId,
        }
    });

    // 5. Seeding Disbursements & associated Transactions (TDS Engine)
    console.log('⏳ Seeding Disbursements (TDS Engine)...');
    
    // Payout 1: Below threshold (₹25,000) - No TDS
    const tx1 = await prisma.transaction.create({
        data: {
            ledgerId: drProfessionalLedger.id,
            type: 'DEBIT',
            amount: 25000.00,
            description: 'Consultation payout May'
        }
    });
    await prisma.disbursement.create({
        data: {
            vendorId: drAnanya.id,
            transactionId: tx1.id,
            grossAmount: 25000.00,
            tdsApplicable: false,
            tdsAmount: 0.00,
            tdsSection: 'SEC_194J',
            netPayout: 25000.00,
            workflowStatus: 'APPROVED',
            createdByUserId: makerUserId,
            approvedByUserId: checkerUserId,
            createdAt: new Date('2026-05-15T10:00:00Z'),
        }
    });

    // Payout 2: Pushes cumulative to ₹45,000. Triggers 10% TDS on the new ₹20,000 payout.
    const tx2 = await prisma.transaction.create({
        data: {
            ledgerId: drProfessionalLedger.id,
            type: 'DEBIT',
            amount: 20000.00,
            description: 'Consultation payout June'
        }
    });
    await prisma.disbursement.create({
        data: {
            vendorId: drAnanya.id,
            transactionId: tx2.id,
            grossAmount: 20000.00,
            tdsApplicable: true,
            tdsAmount: 2000.00, // 10% of 20k
            tdsSection: 'SEC_194J',
            netPayout: 18000.00,
            workflowStatus: 'APPROVED',
            createdByUserId: makerUserId,
            approvedByUserId: checkerUserId,
            createdAt: new Date('2026-06-10T10:00:00Z'),
        }
    });

    // 6. Seeding Financial Ledger (Rule 42 & E-Invoicing)
    console.log('⏳ Seeding General Ledger (Rule 42 & Maker-Checker)...');

    // Entry 1: EXEMPT Healthcare Revenue (Component 'E')
    await prisma.ledger.upsert({
        where: { name: 'IPD Surgery Revenue June 2026' },
        update: {},
        create: {
            name: 'IPD Surgery Revenue June 2026',
            group: 'Revenue',
            baseAmount: 150000.00, // Large IPD Surgery
            taxEligibilityStatus: 'EXEMPT',
            costCenterId: 'IPD_SURGERY',
            workflowStatus: 'APPROVED',
            createdByUserId: makerUserId,
            approvedByUserId: checkerUserId,
            createdAt: new Date('2026-06-05T12:00:00Z'),
        }
    });

    // Entry 2: TAXABLE Pharmacy Revenue (Triggers E-Invoicing)
    await prisma.ledger.upsert({
        where: { name: 'Pharmacy Sales June 2026' },
        update: {},
        create: {
            name: 'Pharmacy Sales June 2026',
            group: 'Revenue',
            baseAmount: 45000.00,
            taxEligibilityStatus: 'TAXABLE',
            hsnSacCode: '3004',
            costCenterId: 'PHARMACY',
            workflowStatus: 'APPROVED',
            createdByUserId: makerUserId,
            approvedByUserId: checkerUserId,
            createdAt: new Date('2026-06-06T14:30:00Z'),
        }
    });

    // Entry 3: Pending Checker Review (Tests Maker-Checker isolation)
    const pendingLedger = await prisma.ledger.upsert({
        where: { name: 'OPD Consultation Revenue June 2026' },
        update: {},
        create: {
            name: 'OPD Consultation Revenue June 2026',
            group: 'Revenue',
            baseAmount: 12500.00,
            taxEligibilityStatus: 'TAXABLE',
            hsnSacCode: '9993',
            costCenterId: 'OPD_CONSULT',
            workflowStatus: 'PENDING_APPROVAL',
            createdByUserId: makerUserId,
            createdAt: new Date('2026-06-20T09:15:00Z'),
        }
    });

    // Entry 4: Common Pool Expense (Component 'C2' for Rule 42)
    await prisma.ledger.upsert({
        where: { name: 'IT Software Maintenance June 2026' },
        update: {},
        create: {
            name: 'IT Software Maintenance June 2026',
            group: 'Expense',
            baseAmount: 50000.00, // IT Software Maintenance
            taxEligibilityStatus: 'TAXABLE',
            hsnSacCode: '998314',
            costCenterId: 'CENTRAL_OPS',
            workflowStatus: 'APPROVED',
            createdByUserId: makerUserId,
            approvedByUserId: checkerUserId,
            createdAt: new Date('2026-06-12T11:00:00Z'),
        }
    });

    // 7. Seeding GSTR-2B Reconciliation Matches (Variance Panel)
    console.log('⏳ Seeding GSTR-2B Recon Variances...');

    // Match 1: Under Tolerance (Eligible for Auto-Write-Off)
    await prisma.reconInvoiceMatch.create({
        data: {
            returnPeriod: 202606,
            receiverGstin: '29AAAAA1111A1Z1',
            matchCategory: 'PARTIAL_MATCH_TAX_MISMATCH',
            varianceTotalGst: 6.50, // Variance is ₹6.50 (Under ₹10 limit)
            reconciledAt: new Date('2026-06-15T01:00:00Z'),
        }
    });

    // Match 2: Severe Variance (Forces Manual Vendor Dispute)
    await prisma.reconInvoiceMatch.create({
        data: {
            returnPeriod: 202606,
            receiverGstin: '29AAAAA1111A1Z1',
            matchCategory: 'PARTIAL_MATCH_TAX_MISMATCH',
            varianceTotalGst: -4500.00, // Vendor short-filed by ₹4500
            reconciledAt: new Date('2026-06-15T01:00:00Z'),
        }
    });

    console.log('Seed completed: Admin, Doctor, Wards, Lab Tests, Medicines, Cost Centers, and Statutory Test data seeded.');
    console.log(`\n📌 TEST DATA GUIDANCE:`);
    console.log(`- Use Ledger ID [${pendingLedger.id}] to test your POST /api/v1/governance/review API.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
