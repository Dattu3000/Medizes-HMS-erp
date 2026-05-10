import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { callGemma } from '../utils/aiService';

export const ambientScribe = async (req: Request, res: Response) => {
    try {
        const { visitId, audioStreamUrl, status } = req.body;
        
        const visit = await prisma.visit.findUnique({
            where: { id: String(visitId) },
            include: { patient: true }
        });

        if (!visit) {
            return res.status(404).json({ message: 'Visit not found' });
        }

        // Update basic status first
        await prisma.visit.update({
            where: { id: visit.id },
            data: { 
                scribeStatus: status,
                ...(audioStreamUrl && { audioStreamUrl })
            }
        });

        if (status === 'PROCESSING') {
            // Simulate audio transcript fetching and NLP parsing
            const mockTranscript = `Doctor: Hello ${visit.patient.firstName}, how are you feeling today?
Patient: My chest hurts a bit when I breathe deeply, and I have a slight cough.
Doctor: I see. Your temperature is 99.5F and blood pressure is 120/80. Let's get a chest X-ray to rule out anything serious. I'll prescribe some cough syrup for now.`;

            const prompt = `You are a clinical NLP engine. Parse the following doctor-patient consultation transcript into a structured SOAP note. 
Exclude all PII (names, specific dates).
Return ONLY a valid JSON object matching this exact shape:
{"Subjective": "Patient history and symptoms", "Objective": "Vitals and physical exam findings", "Assessment": "Potential diagnoses", "Plan": "Next steps, medications, follow-ups"}.
Do NOT wrap the JSON in Markdown formatting like \`\`\`json. Return pure JSON object only.

Transcript:
${mockTranscript}`;

            let soapNoteStr;
            try {
                soapNoteStr = await callGemma(prompt);
            } catch (e) {
                console.error("Gemma AI failed", e);
                return res.status(500).json({ message: 'AI Parsing failed' });
            }

            let soapNote;
            try {
                soapNote = JSON.parse(soapNoteStr);
            } catch (e) {
                // fallback
                soapNote = { "error": "Could not parse JSON", "raw": soapNoteStr };
            }

            // Save the parsed SOAP note
            await prisma.visit.update({
                where: { id: visit.id },
                data: {
                    soapNote,
                    scribeStatus: 'REVIEW_READY'
                }
            });

            return res.status(200).json({
                message: 'Scribe processing complete',
                soapNote
            });
        }

        res.status(200).json({ message: 'Scribe status updated' });
    } catch (error) {
        console.error("Ambient Scribe Error", error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};
