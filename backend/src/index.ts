import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import patientRoutes from './routes/patient';
import ipdRoutes from './routes/ipd';
import labRoutes from './routes/lab';
import pharmacyRoutes from './routes/pharmacy';
import hrRoutes from './routes/hr';
import accountsRoutes from './routes/accounts';
import reportsRoutes from './routes/reports';
import billingRoutes from './routes/billing';
import notificationRoutes from './routes/notification';
import referralRoutes from './routes/referral';
import nursingRoutes from './routes/nursing';
import trainingRoutes from './routes/training';
import infrastructureRoutes from './routes/infrastructure';
import telemedRoutes from './routes/telemed';
import iotRoutes from './routes/iot';
import ehrRoutes from './routes/ehr';
import aiRoutes from './routes/ai';
import claimsRoutes from './routes/claims';
import financeRoutes from './routes/finance';
import governanceRoutes from './routes/governance';
import analyticsRoutes from './routes/analyticsRoutes';
import doctorPortalRouter from './routes/doctorPortalRouter';
import { initCronJobs } from './services/cron';
import { bindBranchContext } from './middlewares/contextBinder';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize background services
initCronJobs();

// === UNAUTHENTICATED Routes (no branch context needed) ===
app.use('/api/auth', authRoutes);

// === BRANCH CONTEXT MIDDLEWARE ===
// All routes below this line automatically bind the user's branchId
// from JWT into AsyncLocalStorage for Prisma query isolation.
// The authenticate middleware runs per-route, so bindBranchContext
// is applied as a secondary middleware on the protected router.
import { authenticate } from './middlewares/authMiddleware';
app.use('/api', authenticate, bindBranchContext);

// === PROTECTED Routes (branch-scoped) ===
app.use('/api/admin', adminRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/ipd', ipdRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/nursing', nursingRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/telemed', telemedRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/governance', governanceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/doctor-portal', doctorPortalRouter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
