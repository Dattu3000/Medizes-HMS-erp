import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { callGemma } from '../utils/aiService';

export const safetyCheck = async (req: Request, res: Response) => {
    try {
        const { patientId } = req.params;

        const patient = await prisma.patient.findUnique({
            where: { id: String(patientId) },
            include: {
                labOrders: { orderBy: { createdAt: 'desc' }, take: 3 },
                prescriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
                admissions: { 
                    include: { nursingVitals: { orderBy: { createdAt: 'desc' }, take: 1 } },
                    orderBy: { admissionDate: 'desc' },
                    take: 1
                }
            }
        });

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Mock Radiology Data since we don't have a DICOM parser / vision model currently
        const mockRadiologyFindings = "Consolidation in lower right lobe observed on recent Chest X-Ray.";

        const latestLabs = patient.labOrders.map(l => ({ test: l.testName, result: l.resultsPayload || l.resultValue }));
        const latestMeds = patient.prescriptions[0]?.medicines || [];
        const latestVitals = patient.admissions[0]?.nursingVitals[0] || {};

        const prompt = `You are a Patient Safety AI. Analyze the following fused clinical data (Labs, Vitals, Prescriptions, and Imaging) for any critical anomalies or drug interactions.
        Return ONLY a valid JSON object matching this exact shape:
        {"riskLevel": "LOW | MODERATE | HIGH | CRITICAL", "findings": [{"source": "String", "detail": "String"}], "recommendation": "String"}.
        Do NOT wrap the JSON in Markdown formatting like \`\`\`json. Return pure JSON object only.

        Patient Age: ${patient.age}
        Vitals: ${JSON.stringify(latestVitals)}
        Recent Labs: ${JSON.stringify(latestLabs)}
        Current Medications: ${JSON.stringify(latestMeds)}
        Imaging Findings: ${mockRadiologyFindings}`;

        let safetyResultStr;
        try {
            safetyResultStr = await callGemma(prompt);
        } catch (e) {
            console.error("Gemma AI failed for Safety Check", e);
            return res.status(500).json({ message: 'AI Safety Check failed' });
        }

        let safetyResult;
        try {
            safetyResult = JSON.parse(safetyResultStr);
        } catch (e) {
            safetyResult = { "error": "Could not parse JSON", "raw": safetyResultStr, "riskLevel": "UNKNOWN" };
        }

        // Cache the result in Patient model
        await prisma.patient.update({
            where: { id: patient.id },
            data: {
                safetyRiskLevel: safetyResult.riskLevel,
                safetyFindings: safetyResult.findings
            }
        });

        res.status(200).json(safetyResult);
    } catch (error) {
        console.error("Safety Check Error", error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
