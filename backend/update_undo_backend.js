const fs = require('fs');

const pathController = 'src/controllers/patientController.ts';
let controllerContent = fs.readFileSync(pathController, 'utf8');

const newFunctions = `
// Undo Lab Order
export const deleteLabOrderFromEHR = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const labOrder = await prisma.labOrder.findUnique({ where: { id } });
        if (!labOrder) return res.status(404).json({ message: 'Lab order not found' });
        if (labOrder.status !== 'PENDING') {
            return res.status(400).json({ message: 'Cannot undo a lab order that is already being processed.' });
        }
        
        // Remove the associated unpaid bill if possible
        await prisma.bill.deleteMany({
            where: { visitId: labOrder.visitId, type: 'LAB_DIAGNOSTICS', status: 'UNPAID', subTotal: labOrder.price }
        });

        await prisma.labOrder.delete({ where: { id } });

        res.status(200).json({ message: 'Lab order undone successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to undo lab order', error });
    }
};

// Undo Prescription
export const deletePrescriptionFromEHR = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const prescription = await prisma.prescription.findUnique({ where: { id } });
        if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
        if (prescription.status !== 'PENDING') {
            return res.status(400).json({ message: 'Cannot undo a prescription that is already dispensed.' });
        }
        
        await prisma.prescription.delete({ where: { id } });

        res.status(200).json({ message: 'Prescription undone successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to undo prescription', error });
    }
};
`;

if (!controllerContent.includes('deleteLabOrderFromEHR')) {
    controllerContent += newFunctions;
    fs.writeFileSync(pathController, controllerContent);
}

const pathRoutes = 'src/routes/patient.ts';
let routesContent = fs.readFileSync(pathRoutes, 'utf8');

if (!routesContent.includes('deleteLabOrderFromEHR')) {
    routesContent = routesContent.replace(
        '} from \'../controllers/patientController\';',
        ', deleteLabOrderFromEHR, deletePrescriptionFromEHR } from \'../controllers/patientController\';'
    );
    
    routesContent = routesContent.replace(
        "export default router;",
        "router.delete('/ehr/lab-order/:id', authenticate, requireRole(doctorRoles), deleteLabOrderFromEHR);\nrouter.delete('/ehr/prescription/:id', authenticate, requireRole(doctorRoles), deletePrescriptionFromEHR);\n\nexport default router;"
    );
    fs.writeFileSync(pathRoutes, routesContent);
}

console.log('Backend endpoints for undo added.');
