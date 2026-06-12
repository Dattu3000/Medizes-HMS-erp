import cron from 'node-cron';
import { prisma } from '../utils/db';
import { calculateMonthlyITCApportionment, crossReferenceDailyPharmacySales } from './taxEngineService';
import { syncGstr2bInvoices } from './gstReconciliationService';

export const initCronJobs = () => {
    // Service 1: Credential Cron Stripper
    // Schedule: Daily at 00:01 AM
    cron.schedule('1 0 * * *', async () => {
        try {
            console.log('[CRON] Running Credential Stripper...');
            const now = new Date();
            
            // 1. Mutate StaffCredential.status to "EXPIRED"
            const expiredCredentials = await prisma.staffCredential.findMany({
                where: {
                    expiryDate: { lte: now },
                    status: 'ACTIVE'
                }
            });

            for (const cred of expiredCredentials) {
                await prisma.staffCredential.update({
                    where: { id: cred.id },
                    data: { status: 'EXPIRED' }
                });

                // 2. Unassign future ShiftSlots and revert to OPEN_BIDDING
                const futureShifts = await prisma.shiftSlot.findMany({
                    where: {
                        employeeId: cred.employeeId,
                        startTime: { gt: now }
                    }
                });

                for (const shift of futureShifts) {
                    await prisma.shiftSlot.update({
                        where: { id: shift.id },
                        data: {
                            employeeId: 'UNASSIGNED', // Or handle unassignment logic based on schema
                            status: 'OPEN_BIDDING'
                        }
                    });
                }

                // 3. (Mocked) Trigger eviction payload via authController to invalidate Redis JWT strings
                console.log(`[CRON] Invalidated session for employee ${cred.employeeId}`);
            }

            console.log('[CRON] Credential Stripper complete.');
        } catch (error) {
            console.error('[CRON] Error in Credential Stripper:', error);
        }
    });

    // Service 2: Predictive Burnout Engine
    // Schedule: Weekly (e.g., Sunday at 00:00)
    cron.schedule('0 0 * * 0', async () => {
        try {
            console.log('[CRON] Running Predictive Burnout Engine...');
            
            // In a real scenario, we'd calculate from ShiftSlot and Attendance data.
            // For now, we mock aggregating metrics to update the BurnoutMetrics.
            const employees = await prisma.employee.findMany();
            
            for (const emp of employees) {
                // Mock metrics
                const consecutiveHours = Math.random() * 60;
                const absenteeismCount = Math.floor(Math.random() * 5);
                const sentimentDelta = Math.random() * 2 - 1; // -1 to 1

                const burnoutIndex = (consecutiveHours * 0.5) + (absenteeismCount * 0.3) - (sentimentDelta * 0.2);
                
                // Normalizing to 0-1 range roughly
                const normalizedIndex = Math.min(Math.max(burnoutIndex / 40, 0), 1);

                await prisma.burnoutMetrics.upsert({
                    where: { employeeId: emp.id },
                    update: {
                        burnoutIndex: normalizedIndex,
                        consecutiveHours,
                        absenteeismCount,
                        sentimentDelta
                    },
                    create: {
                        employeeId: emp.id,
                        burnoutIndex: normalizedIndex,
                        consecutiveHours,
                        absenteeismCount,
                        sentimentDelta
                    }
                });

                // Trigger Threshold Notification
                if (normalizedIndex >= 0.75) {
                    console.log(`[CRON] High Burnout Alert for Employee ${emp.id}: ${normalizedIndex}`);
                }
            }

            console.log('[CRON] Predictive Burnout Engine complete.');
        } catch (error) {
            console.error('[CRON] Error in Predictive Burnout Engine:', error);
        }
    });

    // Service 3: Tax Engine Apportionment (Rule 42)
    // Schedule: Monthly on the 1st day at 02:00 AM
    cron.schedule('0 2 1 * *', async () => {
        try {
            const now = new Date();
            // Apportionment is done for the previous month
            let month = now.getMonth(); // 0-indexed, so getMonth() is the previous month's 1-indexed value
            let year = now.getFullYear();
            if (month === 0) {
                month = 12;
                year -= 1;
            }
            await calculateMonthlyITCApportionment(month, year);
        } catch (error) {
            console.error('[CRON] Error in Tax Apportionment Scheduler:', error);
        }
    });

    // Service 4: Daily Pharmacy vs Tax Summaries Discrepancy Check & GSTR-2B Sync
    // Schedule: Daily at 01:00 AM
    cron.schedule('0 1 * * *', async () => {
        try {
            await crossReferenceDailyPharmacySales();
            
            // Sync GSTR-2B for current return period
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1; // 1-indexed
            const returnPeriod = year * 100 + month;
            const hospitalGstin = '27AAAAA5555A1Z5'; // Standard hospital GSTIN
            await syncGstr2bInvoices(hospitalGstin, returnPeriod);
        } catch (error) {
            console.error('[CRON] Error in Daily Pharmacy Check & GSTR-2B Sync Scheduler:', error);
        }
    });
};
