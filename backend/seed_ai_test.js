const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTestState() {
    try {
        console.log("Seeding test data for AI Integration...");
        // 1. Admit a patient
        const patient = await prisma.patient.findFirst();
        if (!patient) throw new Error("No patient found");
        
        const doctor = await prisma.employee.findFirst({ where: { user: { role: { name: 'Doctor' } } } });
        if (!doctor) throw new Error("No doctor found");
        
        const bed = await prisma.bed.findFirst({ where: { status: 'AVAILABLE' } });
        if (!bed) throw new Error("No available bed found");

        const admission = await prisma.admission.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                bedId: bed.id,
                status: 'ADMITTED',
                depositAmount: 5000,
            }
        });
        await prisma.bed.update({ where: { id: bed.id }, data: { status: 'OCCUPIED' } });

        await prisma.ipdCharge.createMany({
            data: [
                { admissionId: admission.id, chargeType: 'ROOM_RENT', description: 'Room Rent', amount: 1500 },
                { admissionId: admission.id, chargeType: 'DOCTOR_VISIT', description: 'Dr Consultation', amount: 500 },
                { admissionId: admission.id, chargeType: 'PHARMACY', description: 'Medicines', amount: 800 }
            ]
        });
        console.log("1. Admitted patient:", admission.id);

        // 2. Add a Lab Order with resultsPayload
        const labOrder = await prisma.labOrder.create({
            data: {
                patientId: patient.id,
                testName: 'Complete Blood Count (CBC)',
                price: 450,
                status: 'RESULT_ENTERED',
                sampleStatus: 'IN_ANALYSIS',
                resultsPayload: [
                    { parameter: "Hemoglobin", value: 9.2, unit: "g/dL", range: "12.0-16.0", isAbnormal: true },
                    { parameter: "WBC Count", value: 15000, unit: "cumm", range: "4000-11000", isAbnormal: true },
                    { parameter: "Platelet Count", value: 120000, unit: "cumm", range: "150000-450000", isAbnormal: true }
                ]
            }
        });
        console.log("2. Created Lab Order:", labOrder.id);

        // 3. Billing anomaly: A bill with an unusually high discount
        const bill = await prisma.bill.create({
            data: {
                billNo: `BL-ANOMALY-${Date.now()}`,
                patientId: patient.id,
                type: 'OPD_CONSULTATION',
                subTotal: 1000,
                gstAmount: 180,
                discount: 900, // 90% discount!
                netPayable: 280,
                paymentMode: 'CASH',
                status: 'PAID'
            }
        });
        console.log("3. Created anomalous bill:", bill.id);

        console.log("Test data seeded successfully.");
    } catch (err) {
        console.error("Error seeding:", err);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestState();
