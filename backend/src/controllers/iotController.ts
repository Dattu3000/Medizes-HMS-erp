import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// EWS (Early Warning Score - NEWS2) Calculator
const calculateNEWS2 = (vitals: { heartRate: number; bp: string; temperature: number; respiratoryRate: number; spo2: number }): number => {
    let score = 0;

    // Heart Rate
    if (vitals.heartRate <= 40 || vitals.heartRate >= 131) score += 3;
    else if (vitals.heartRate >= 111 && vitals.heartRate <= 130) score += 2;
    else if ((vitals.heartRate >= 41 && vitals.heartRate <= 50) || (vitals.heartRate >= 91 && vitals.heartRate <= 110)) score += 1;

    // Systolic BP
    const systolic = parseInt(vitals.bp.split('/')[0]) || 120;
    if (systolic <= 90 || systolic >= 220) score += 3;
    else if (systolic >= 91 && systolic <= 100) score += 2;
    else if (systolic >= 101 && systolic <= 110) score += 1;

    // Temperature (Celsius)
    if (vitals.temperature <= 35.0) score += 3;
    else if (vitals.temperature >= 39.1) score += 2;
    else if (vitals.temperature >= 35.1 && vitals.temperature <= 36.0) score += 1;
    else if (vitals.temperature >= 38.1 && vitals.temperature <= 39.0) score += 1;

    // Respiratory Rate
    if (vitals.respiratoryRate <= 8 || vitals.respiratoryRate >= 25) score += 3;
    else if (vitals.respiratoryRate >= 21 && vitals.respiratoryRate <= 24) score += 2;
    else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 11) score += 1;

    // SpO2
    if (vitals.spo2 <= 91) score += 3;
    else if (vitals.spo2 >= 92 && vitals.spo2 <= 93) score += 2;
    else if (vitals.spo2 >= 94 && vitals.spo2 <= 95) score += 1;

    return score;
};

// 1. Register a new Medical Device
export const registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
        const { deviceName, macAddress, wardId } = req.body;

        const device = await prisma.device.upsert({
            where: { macAddress },
            update: {
                deviceName,
                wardId,
                status: 'ONLINE',
                lastSync: new Date()
            },
            create: {
                deviceName,
                macAddress,
                wardId,
                status: 'ONLINE',
            }
        });

        res.status(201).json({ message: 'Device registered successfully', device });
    } catch (error: any) {
        res.status(500).json({ message: 'Error registering device', error: error.message });
    }
};

// 2. Ingest IoT Vitals (This would typically be called by the MQTT subscriber worker)
export const ingestDeviceVitals = async (req: Request, res: Response): Promise<void> => {
    try {
        const { macAddress, admissionId, heartRate, bp, temperature, respiratoryRate, spo2 } = req.body;

        // Verify Device
        const device = await prisma.device.findUnique({ where: { macAddress } });
        if (!device) {
            res.status(404).json({ message: 'Device not recognized' });
            return;
        }

        // Validate Noise (e.g. sensor detached)
        if (!heartRate || heartRate < 20 || !spo2 || spo2 < 30) {
            // Update device status to ALERT without logging bad data
            await prisma.device.update({
                where: { macAddress },
                data: { status: 'ALERT', lastSync: new Date() }
            });
            res.status(400).json({ message: 'Sensor data out of valid range. Possible detachment.' });
            return;
        }

        const vitals = { heartRate, bp, temperature, respiratoryRate, spo2 };
        const ewsScore = calculateNEWS2(vitals);
        
        let ewsRiskLevel = 'LOW';
        if (ewsScore >= 7) ewsRiskLevel = 'CRITICAL';
        else if (ewsScore >= 5) ewsRiskLevel = 'HIGH';
        else if (ewsScore >= 3) ewsRiskLevel = 'MEDIUM';

        // Update Device sync time
        await prisma.device.update({
            where: { macAddress },
            data: { status: 'ONLINE', lastSync: new Date() }
        });

        // Save Vitals
        const newVitals = await prisma.nursingVitals.create({
            data: {
                admissionId,
                bp,
                heartRate,
                temperature,
                spo2,
                respiratoryRate,
                ewsScore,
                ewsRiskLevel,
                recordedBy: 'IoT_Gateway',
                notes: `Auto-ingested from device ${device.deviceName}`
            }
        });

        // Trigger RRT Notification if EWS is Critical or High
        if (ewsRiskLevel === 'HIGH' || ewsRiskLevel === 'CRITICAL') {
            await prisma.notification.create({
                data: {
                    targetUserId: 'RRT_GROUP', // Rapid Response Team pseudo-ID or group mapping
                    type: 'CLINICAL_ALERT',
                    title: `CRITICAL: EWS Score ${ewsScore} on Ward ${device.wardId}`,
                    body: `Patient admission ${admissionId} triggered an Early Warning Score of ${ewsScore}. Immediate RRT intervention required.`,
                    priority: 'CRITICAL',
                    visitId: admissionId, // Reusing field for context
                }
            });
        }

        res.status(201).json({ message: 'Vitals ingested successfully', vitals: newVitals, ewsScore, ewsRiskLevel });
    } catch (error: any) {
        res.status(500).json({ message: 'Error ingesting vitals', error: error.message });
    }
};

export const getDevices = async (req: Request, res: Response): Promise<void> => {
    try {
        const devices = await prisma.device.findMany({
            include: { ward: true }
        });
        res.status(200).json(devices);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching devices', error: error.message });
    }
};
