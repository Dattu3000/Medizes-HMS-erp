import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

export const registerPatient = async (req: Request, res: Response) => {
    try {
        const {
            firstName, lastName, age, dob, gender, bloodGroup, maritalStatus,
            mobile, email, address, city, state, pincode,
            emgName, emgRelation, emgMobile,
            tpaName, policyNo, insuranceValid, coverageAmt,
            referredBy
        } = req.body;

        const userId = (req as any).user.id;

        // Generate unique UHID (e.g. UHID-12345678)
        const count = await prisma.patient.count();
        const uhid = `UHID-${String(count + 1000).padStart(6, '0')}`;

        const parsedDob = dob ? new Date(dob) : null;
        const parsedValid = insuranceValid ? new Date(insuranceValid) : null;

        const patient = await prisma.patient.create({
            data: {
                uhid, firstName, lastName, age: Number(age), dob: parsedDob, gender, bloodGroup, maritalStatus,
                mobile, email, address, city, state, pincode,
                emgName, emgRelation, emgMobile,
                tpaName, policyNo, insuranceValid: parsedValid, coverageAmt: coverageAmt ? Number(coverageAmt) : null,
                referredBy
            }
        });

        await logAudit(userId, 'REGISTERED_PATIENT', { uhid, patientId: patient.id }, req.ip || null);

        res.status(201).json({ message: 'Patient registered successfully', patient });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to register patient', error });
    }
};

export const searchPatients = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(200).json([]);

        const q = String(query).toLowerCase();

        // Search by UHID, Mobile, or Name
        const patients = await prisma.patient.findMany({
            where: {
                OR: [
                    { uhid: { contains: q, mode: 'insensitive' } },
                    { mobile: { contains: q } },
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } }
                ]
            },
            take: 10
        });

        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Failed to search patients', error });
    }
};

export const createVisit = async (req: Request, res: Response) => {
    try {
        const { patientId, doctorId, department, notes, symptoms } = req.body;
        const userId = (req as any).user.id;

        // Validate Doctor
        const doctor = await prisma.employee.findUnique({ where: { id: doctorId } });
        if (!doctor || doctor.designation !== 'Doctor') {
            return res.status(400).json({ message: 'Invalid doctor selection' });
        }

        // Generate Token No (simplified token logic simply taking daily count)
        const tokenNo = `TKN-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const visit = await prisma.$transaction(async (tx) => {
            const v = await tx.visit.create({
                data: {
                    patientId, doctorId, department, tokenNo, notes, symptoms, status: 'WAITING'
                }
            });

            // Creating Initial Consultation Bill automatically Step 1B (3)
            const consultationFee = 500; // Flat fee or fetch from setup
            const registrationFee = 100; // Assuming this is standard
            const gstAmount = (consultationFee + registrationFee) * 0.18; // 18% GST (SAC: 999311)
            const netPayable = consultationFee + registrationFee + gstAmount;

            const billNo = `BL-OPD-${Date.now()}`;

            await tx.bill.create({
                data: {
                    billNo, patientId, visitId: v.id, type: 'OPD_CONSULTATION',
                    subTotal: consultationFee + registrationFee,
                    gstAmount, discount: 0, netPayable, paymentMode: 'CASH', // default to cash before payment collected
                    status: 'UNPAID'
                }
            });

            return v;
        });

        await logAudit(userId, 'CREATED_OPD_VISIT', { visitId: visit.id, patientId, doctorId }, req.ip || null);

        res.status(201).json({ message: 'Visit created successfully, Token: ' + tokenNo, visit });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create OPD visit', error });
    }
};

export const getDoctors = async (req: Request, res: Response) => {
    try {
        const doctors = await prisma.employee.findMany({
            where: { designation: 'Doctor' },
            select: { id: true, firstName: true, lastName: true, department: true }
        });
        res.status(200).json(doctors);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch doctors', err });
    }
};

export const getDoctorEHR = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Find employee mapping
        const employee = await prisma.employee.findUnique({ where: { userId } });
        if (!employee) return res.status(403).json({ message: "No employee profile found" });

        // Retrieve active visits for this doctor with full clinical data
        const visits = await prisma.visit.findMany({
            where: {
                doctorId: employee.id,
                status: { in: ['WAITING', 'IN_CONSULTATION'] }
            },
            include: {
                patient: true,
                labOrders: { orderBy: { createdAt: 'desc' } },
                prescriptions: { orderBy: { createdAt: 'desc' } }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(visits);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load Doctor EHR active visits', err });
    }
};

export const submitClinicalNote = async (req: Request, res: Response) => {
    try {
        const { visitId } = req.params;
        const { notes, diagnosis, status } = req.body;
        const userId = (req as any).user.id;

        const updatedVisit = await prisma.visit.update({
            where: { id: String(visitId) },
            data: {
                notes,
                ...(diagnosis && { diagnosis }),
                ...(status && { status })
            }
        });

        await logAudit(userId, 'EHR_NOTE_ADDED', { visitId }, req.ip || null);

        res.status(200).json({ message: 'Clinical note saved successfully', visit: updatedVisit });
    } catch (error) {
        res.status(500).json({ message: 'Failed to submit clinical note', error });
    }
};

// Scenario 1: Doctor orders lab test from EHR
export const orderLabFromEHR = async (req: Request, res: Response) => {
    try {
        const { visitId, testId, priority } = req.body;
        const userId = (req as any).user.id;

        const visit = await prisma.visit.findUnique({
            where: { id: visitId },
            include: { patient: true }
        });
        if (!visit) return res.status(404).json({ message: 'Visit not found' });

        const testInfo = await prisma.labCatalog.findUnique({ where: { id: testId } });
        if (!testInfo) return res.status(404).json({ message: 'Test not in catalog' });

        const order = await prisma.$transaction(async (tx) => {
            const labOrder = await tx.labOrder.create({
                data: {
                    patientId: visit.patientId,
                    visitId,
                    testName: testInfo.testName,
                    price: testInfo.price,
                    priority: priority || 'ROUTINE',
                    status: 'PENDING'
                }
            });

            // Auto-generate bill for the test
            const gstAmount = testInfo.price * 0.18;
            const netPayable = testInfo.price + gstAmount;

            await tx.bill.create({
                data: {
                    billNo: `BL-LAB-${Date.now()}`,
                    patientId: visit.patientId,
                    visitId,
                    type: 'LAB_DIAGNOSTICS',
                    subTotal: testInfo.price,
                    gstAmount,
                    discount: 0,
                    netPayable,
                    paymentMode: 'CASH',
                    status: 'UNPAID'
                }
            });

            return labOrder;
        });

        await logAudit(userId, 'EHR_LAB_ORDERED', { orderId: order.id, test: testInfo.testName }, req.ip || null);
        res.status(201).json({ message: 'Lab test ordered from EHR', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to order lab test from EHR', error });
    }
};

// Scenario 2: Doctor creates prescription with stock check
export const createPrescription = async (req: Request, res: Response) => {
    try {
        const { visitId, medicines } = req.body;
        // medicines: Array<{ drugName, dosage, frequency, days }>
        const userId = (req as any).user.id;

        const visit = await prisma.visit.findUnique({ where: { id: visitId } });
        if (!visit) return res.status(404).json({ message: 'Visit not found' });

        // Stock check for each medicine
        const outOfStock: string[] = [];
        for (const med of medicines) {
            const inventory = await prisma.medicineInventory.findUnique({
                where: { drugName: med.drugName }
            });
            if (!inventory || inventory.stockQuantity < 1) {
                outOfStock.push(med.drugName);
            }
        }

        if (outOfStock.length > 0) {
            return res.status(400).json({
                message: `Insufficient stock for: ${outOfStock.join(', ')}`,
                outOfStock
            });
        }

        const prescription = await prisma.prescription.create({
            data: {
                patientId: visit.patientId,
                visitId,
                medicines: medicines,
                status: 'PENDING'
            }
        });

        // Create notification for pharmacy staff
        // (We target all users — in production this would target pharmacy role)
        await logAudit(userId, 'PRESCRIPTION_CREATED', { prescriptionId: prescription.id }, req.ip || null);

        res.status(201).json({ message: 'Prescription created', prescription });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create prescription', error });
    }
};

// Scenario 1: Update visit status transitions
export const updateVisitStatus = async (req: Request, res: Response) => {
    try {
        const { visitId } = req.params;
        const { status } = req.body;
        const userId = (req as any).user.id;

        const validTransitions: Record<string, string[]> = {
            'WAITING': ['IN_CONSULTATION'],
            'IN_CONSULTATION': ['COMPLETED'],
        };

        const visit = await prisma.visit.findUnique({ where: { id: String(visitId) } });
        if (!visit) return res.status(404).json({ message: 'Visit not found' });

        const allowed = validTransitions[visit.status];
        if (!allowed || !allowed.includes(status)) {
            return res.status(400).json({ message: `Invalid transition from ${visit.status} to ${status}` });
        }

        const updated = await prisma.visit.update({
            where: { id: String(visitId) },
            data: { status }
        });

        await logAudit(userId, 'VISIT_STATUS_CHANGED', { visitId, from: visit.status, to: status }, req.ip || null);
        res.status(200).json({ message: 'Visit status updated', visit: updated });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update visit status', error });
    }
};
