const fs = require('fs');

const pathController = 'src/controllers/pharmacyController.ts';
let controllerContent = fs.readFileSync(pathController, 'utf8');

const undoDispenseFunc = `
// Undo Dispense
export const undoDispensePrescription = async (req: Request, res: Response) => {
    try {
        const { prescriptionId } = req.body;
        const userId = (req as any).user.id;

        const prescription = await prisma.prescription.findUnique({
            where: { id: prescriptionId }
        });

        if (!prescription || prescription.status !== 'DISPENSED') {
            return res.status(400).json({ message: 'Prescription not found or not dispensed' });
        }

        const medicines = prescription.medicines as any[];

        await prisma.$transaction(async (tx) => {
            // Restore stock
            for (const med of medicines) {
                const drug = await tx.medicineInventory.findUnique({
                    where: { drugName: med.drugName }
                });
                if (drug) {
                    await tx.medicineInventory.update({
                        where: { id: drug.id },
                        data: { stockQuantity: drug.stockQuantity + 1 }
                    });
                }
            }

            // Set to pending
            await tx.prescription.update({
                where: { id: prescriptionId },
                data: { status: 'PENDING' }
            });

            // Delete unpaid bill if it exists
            await tx.bill.deleteMany({
                where: { visitId: prescription.visitId, type: 'PHARMACY', status: 'UNPAID' }
            });
        });

        res.status(200).json({ message: 'Dispense undone successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to undo dispense', error });
    }
};
`;

if (!controllerContent.includes('undoDispensePrescription')) {
    controllerContent += undoDispenseFunc;
    fs.writeFileSync(pathController, controllerContent);
}

const pathRoutes = 'src/routes/pharmacy.ts';
let routesContent = fs.readFileSync(pathRoutes, 'utf8');

if (!routesContent.includes('undoDispensePrescription')) {
    routesContent = routesContent.replace(
        '} from \'../controllers/pharmacyController\';',
        ', undoDispensePrescription } from \'../controllers/pharmacyController\';'
    );
    
    routesContent = routesContent.replace(
        "export default router;",
        "router.post('/prescriptions/undo', authenticate, requireRole(['Super Admin', 'Admin', 'Pharmacist', 'Doctor']), undoDispensePrescription);\n\nexport default router;"
    );
    fs.writeFileSync(pathRoutes, routesContent);
}

console.log('Pharmacy Undo Endpoints Added');
