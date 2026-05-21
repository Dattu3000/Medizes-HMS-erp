import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Starting Medisys HMS End-to-End Simulation Seeding...');

    // 1. Core Infrastructure setup
    const mainBranch = await prisma.branch.upsert({
        where: { id: 'branch-sim-main' },
        update: {},
        create: {
            id: 'branch-sim-main',
            name: 'Medisys Main Hospital',
            location: 'New York, NY',
        },
    });

    const doctorRole = await prisma.role.upsert({
        where: { name: 'Doctor' },
        update: {},
        create: { name: 'Doctor', permissions: ['OPD_VIEW', 'PRESCRIPTION_CREATE', 'LAB_ORDER_CREATE'] }
    });

    const supportRole = await prisma.role.upsert({
        where: { name: 'Support Staff' },
        update: {},
        create: { name: 'Support Staff', permissions: ['OPD_VIEW'] }
    });

    const docPasswordHash = await bcrypt.hash('doc123', 10);
    const staffPasswordHash = await bcrypt.hash('staff123', 10);

    const departments = ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'General Medicine', 'Oncology', 'Dermatology'];

    console.log('👨‍⚕️ Generating 20 Doctors...');
    const doctors = [];
    for (let i = 0; i < 20; i++) {
        const empId = `DOC-SIM-${1000 + i}`;
        const doc = await prisma.user.upsert({
            where: { employeeId: empId },
            update: {},
            create: {
                employeeId: empId,
                email: faker.internet.email(),
                passwordHash: docPasswordHash,
                roleId: doctorRole.id,
                branchId: mainBranch.id,
                employee: {
                    create: {
                        firstName: faker.person.firstName(),
                        lastName: faker.person.lastName(),
                        department: faker.helpers.arrayElement(departments),
                        designation: 'Senior Consultant',
                        mobile: faker.phone.number(),
                    }
                }
            },
            include: { employee: true }
        });
        doctors.push(doc);
    }

    console.log('👩‍💼 Generating 15 Support Staff...');
    for (let i = 0; i < 15; i++) {
        const empId = `STF-SIM-${1000 + i}`;
        await prisma.user.upsert({
            where: { employeeId: empId },
            update: {},
            create: {
                employeeId: empId,
                email: faker.internet.email(),
                passwordHash: staffPasswordHash,
                roleId: supportRole.id,
                branchId: mainBranch.id,
                employee: {
                    create: {
                        firstName: faker.person.firstName(),
                        lastName: faker.person.lastName(),
                        department: 'Administration',
                        designation: faker.helpers.arrayElement(['Receptionist', 'Nurse', 'Lab Technician']),
                        mobile: faker.phone.number(),
                    }
                }
            }
        });
    }

    console.log('🤒 Generating 30 Patients and simulating visits, labs, and bills...');
    const patients = [];
    for (let i = 0; i < 30; i++) {
        const uhid = `UHID-SIM-${faker.number.int({ min: 100000, max: 999999 })}`;
        
        // Ensure UHID doesn't clash
        const existingPatient = await prisma.patient.findUnique({ where: { uhid } });
        if (existingPatient) continue;

        const patient = await prisma.patient.create({
            data: {
                uhid,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                age: faker.number.int({ min: 5, max: 85 }),
                gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
                bloodGroup: faker.helpers.arrayElement(['A+', 'B+', 'O+', 'AB+', 'O-']),
                mobile: faker.phone.number(),
                email: faker.internet.email(),
                address: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                branchId: mainBranch.id
            }
        });
        patients.push(patient);

        // Assign a random doctor
        const assignedDoctor = faker.helpers.arrayElement(doctors);
        
        // 1. Create a Visit
        const visit = await prisma.visit.create({
            data: {
                patientId: patient.id,
                doctorId: assignedDoctor.employee!.id,
                department: assignedDoctor.employee!.department || 'General Medicine',
                tokenNo: `TKN-${faker.number.int({ min: 100, max: 999 })}`,
                status: 'COMPLETED',
                notes: faker.lorem.paragraph(),
                symptoms: faker.lorem.words(3),
                diagnosis: faker.lorem.words(2)
            }
        });

        // 2. Create Consultation Bill (UNPAID so they show up in Billing Queue)
        const subTotal = faker.number.int({ min: 500, max: 2500 });
        const gst = subTotal * 0.18;
        await prisma.bill.create({
            data: {
                billNo: `INV-SIM-${faker.string.alphanumeric(6).toUpperCase()}`,
                patientId: patient.id,
                visitId: visit.id,
                type: 'OPD_CONSULTATION',
                subTotal: subTotal,
                gstAmount: gst,
                netPayable: subTotal + gst,
                paymentMode: 'PENDING',
                status: 'UNPAID',
                branchId: mainBranch.id
            }
        });

        // 3. Random Lab Order (50% chance)
        if (faker.datatype.boolean()) {
            await prisma.labOrder.create({
                data: {
                    patientId: patient.id,
                    visitId: visit.id,
                    testName: faker.helpers.arrayElement(['Complete Blood Count', 'Lipid Profile', 'Thyroid Panel', 'HbA1c', 'Liver Function Test']),
                    price: faker.number.int({ min: 400, max: 3000 }),
                    status: 'PENDING',
                    priority: faker.helpers.arrayElement(['ROUTINE', 'URGENT']),
                    branchId: mainBranch.id
                }
            });
            // Create Lab Bill
            const labTotal = faker.number.int({ min: 400, max: 3000 });
            await prisma.bill.create({
                data: {
                    billNo: `LAB-SIM-${faker.string.alphanumeric(6).toUpperCase()}`,
                    patientId: patient.id,
                    visitId: visit.id,
                    type: 'LAB_DIAGNOSTICS',
                    subTotal: labTotal,
                    gstAmount: 0,
                    netPayable: labTotal,
                    paymentMode: 'PENDING',
                    status: 'UNPAID',
                    branchId: mainBranch.id
                }
            });
        }

        // 4. Random Prescription (60% chance)
        if (faker.number.int({ min: 1, max: 10 }) <= 6) {
            await prisma.prescription.create({
                data: {
                    patientId: patient.id,
                    visitId: visit.id,
                    medicines: [
                        { name: faker.helpers.arrayElement(['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Metformin']), dose: '1 Tab', frequency: 'Twice a day', days: 5 },
                        { name: faker.helpers.arrayElement(['Vitamin C', 'B-Complex', 'Calcium', 'Ibuprofen']), dose: '1 Tab', frequency: 'Once a day', days: 10 }
                    ],
                    status: 'PENDING',
                    branchId: mainBranch.id
                }
            });
        }
    }

    console.log('✅ Simulation Data Generation Complete!');
    console.log(`Summary: Created 20 Doctors, 15 Support Staff, ${patients.length} Patients with interconnected visits, unpaid bills, lab orders, and prescriptions.`);
}

main()
    .catch((e) => {
        console.error("Simulation Seeding Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
