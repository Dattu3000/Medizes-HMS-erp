import { Request, Response } from 'express';
import { generateGstr3bJson, generateTds26qText } from '../services/exportService';

export const exportGstr3b = async (req: Request, res: Response) => {
    try {
        const { returnPeriod } = req.params;

        if (!returnPeriod || isNaN(Number(returnPeriod))) {
            return res.status(400).json({ message: 'Valid return period (YYYYMM) is required' });
        }

        const jsonContent = await generateGstr3bJson(Number(returnPeriod));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=GSTR3B_${returnPeriod}.json`);
        res.status(200).send(jsonContent);
    } catch (error) {
        console.error('[EXPORT CONTROLLER] GSTR-3B export error:', error);
        res.status(500).json({ message: 'Internal server error during GSTR-3B export', error });
    }
};

export const exportTds26q = async (req: Request, res: Response) => {
    try {
        const { returnPeriod } = req.params;

        if (!returnPeriod || isNaN(Number(returnPeriod))) {
            return res.status(400).json({ message: 'Valid return period (YYYYMM) is required' });
        }

        const textContent = await generateTds26qText(Number(returnPeriod));

        // Use standard text/plain but force browser to download as file
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=TDS_26Q_${returnPeriod}.txt`);
        res.status(200).send(textContent);
    } catch (error) {
        console.error('[EXPORT CONTROLLER] TDS 26Q export error:', error);
        res.status(500).json({ message: 'Internal server error during TDS 26Q export', error });
    }
};
