import { Router, Request, Response } from 'express';
import { generateMidMonthTaxForecast } from '../services/taxForecastingService';

const router = Router();

router.get('/predictive-tax', async (req: Request, res: Response): Promise<void> => {
  const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
  const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;

  try {
    const forecast = await generateMidMonthTaxForecast(year, month);
    res.status(200).json({
      success: true,
      data: forecast
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
