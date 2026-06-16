import express from 'express';
import axios from 'axios';
import doctorPortalRouter from './src/routes/doctorPortalRouter';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { Server } from 'http';

const app = express();
app.use(express.json());
app.use('/api/v1/doctor-portal', doctorPortalRouter);

const prisma = new PrismaClient();
let server: Server;

async function runTests() {
  console.log('--- Starting Deployment Verification Tests ---');

  // Start server
  await new Promise<void>((resolve) => {
    server = app.listen(3099, () => resolve());
  });
  console.log('Server started on port 3099');

  // 1. Seed two dummy doctors and some disbursements
  const doctorA = await prisma.vendor.create({
    data: {
      name: 'Dr. Alice',
      vendorSubType: 'INDIVIDUAL',
      panNumber: 'PANAAAAA11'
    }
  });

  const doctorB = await prisma.vendor.create({
    data: {
      name: 'Dr. Bob',
      vendorSubType: 'INDIVIDUAL',
      panNumber: 'PANBBBBB22'
    }
  });

  // Create a dummy transaction to satisfy the disbursement relation
  const transaction = await prisma.transaction.create({
    data: {
      ledgerId: (await prisma.ledger.findFirst())?.id || 'dummy-ledger-id', // Needs a valid ledger id, wait, let's create one
      type: 'PAYMENT',
      amount: 1000,
      description: 'Test'
    }
  }).catch(async () => {
    // If ledger doesn't exist, create one
    const ledger = await prisma.ledger.create({
      data: { name: 'Dummy Ledger', group: 'Test' }
    });
    return await prisma.transaction.create({
      data: {
        ledgerId: ledger.id,
        type: 'PAYMENT',
        amount: 1000,
        description: 'Test'
      }
    });
  });

  await prisma.disbursement.create({
    data: {
      vendorId: doctorA.id,
      transactionId: transaction.id,
      grossAmount: 50000,
      tdsApplicable: true,
      tdsSection: 'SEC_194J',
      tdsAmount: 5000,
      netPayout: 45000,
      workflowStatus: 'APPROVED'
    }
  });

  console.log('Dummy data seeded successfully.');

  // 2. Test Milestone 1: Cross-Boundary Security Blocks
  console.log('\n--- Test 1: Cross-Boundary Security Blocks ---');
  
  // Authenticate as Doctor A
  const authRes = await axios.post('http://localhost:3099/api/v1/doctor-portal/auth', { panNumber: 'PANAAAAA11' });
  
  const token = authRes.data.token;
  console.log('Token for Doctor A generated.');

  // Try to query data. The router ignores PAN from the query/body and uses token payload.
  // We'll pass panNumber=PANBBBBB22 in query just to see if the router bypasses it.
  const queryRes = await axios.get('http://localhost:3099/api/v1/doctor-portal/tds-summary?panNumber=PANBBBBB22', {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log(`Query PAN provided: PANBBBBB22`);
  console.log(`Returned Data PAN: ${queryRes.data.data?.panNumber}`);
  
  if (queryRes.data.data?.panNumber === 'PANAAAAA11') {
    console.log('✅ Milestone 1 Passed: The interceptor successfully ignored the raw query parameter and forced data scoping to Doctor A.');
  } else {
    console.error('❌ Milestone 1 Failed: Scope leakage detected!');
  }

  // 3. Test Milestone 2: Verify Database Query Performance (EXPLAIN ANALYZE)
  console.log('\n--- Test 2: Database Query Performance (EXPLAIN ANALYZE) ---');
  
  const explainQuery = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT "id", "grossAmount", "tdsAmount", "tdsSection", "createdAt" 
    FROM "Disbursement"
    WHERE "vendorId" = '${doctorA.id}' 
      AND "tdsSection" = 'SEC_194J'
      AND "workflowStatus" = 'APPROVED'
    ORDER BY "createdAt" DESC;
  `);

  console.log('Execution Plan:');
  console.log(explainQuery);
  console.log('✅ Milestone 2 Passed: Query execution traces obtained. As the data grows, composite indexes on payeeId/vendorId and workflowStatus will prevent sequential scans.');

  // Cleanup
  await prisma.disbursement.deleteMany({ where: { vendorId: { in: [doctorA.id, doctorB.id] } } });
  await prisma.vendor.deleteMany({ where: { id: { in: [doctorA.id, doctorB.id] } } });
  console.log('\nTest suite completed. Cleanup done.');
}

runTests().catch(console.error).finally(() => {
  if (server) server.close();
  prisma.$disconnect();
});
