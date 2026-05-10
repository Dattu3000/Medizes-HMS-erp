const fs = require('fs');

const pathController = 'src/controllers/pharmacyController.ts';
let controllerContent = fs.readFileSync(pathController, 'utf8');

if (controllerContent.includes("where: { status: 'PENDING' }")) {
    controllerContent = controllerContent.replace(
        "where: { status: 'PENDING' },",
        ""
    );
    controllerContent = controllerContent.replace(
        "orderBy: { createdAt: 'asc' }",
        "orderBy: { createdAt: 'desc' }, take: 50" // to avoid fetching too many
    );
    fs.writeFileSync(pathController, controllerContent);
    console.log('Backend getPrescriptionQueue updated to show all.');
} else {
    console.log('Already updated or not found.');
}
