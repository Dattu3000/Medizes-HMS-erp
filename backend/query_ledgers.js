const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ledgers = await prisma.ledger.findMany({
        where: {
            workflowStatus: 'APPROVED'
        }
    });
    console.log('--- ALL APPROVED LEDGERS ---');
    console.log(JSON.stringify(ledgers.map(l => ({
        id: l.id,
        name: l.name,
        code: l.code,
        group: l.group,
        baseAmount: l.baseAmount,
        taxEligibilityStatus: l.taxEligibilityStatus,
        workflowStatus: l.workflowStatus,
        createdAt: l.createdAt
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
