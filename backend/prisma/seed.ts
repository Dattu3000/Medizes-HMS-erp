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

    console.log('Seed completed: Admin, Doctor, Wards, Lab Tests & Medicines seeded');
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
