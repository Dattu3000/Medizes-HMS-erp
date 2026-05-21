import cron from 'node-cron';
import { prisma } from '../utils/db';

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
};
