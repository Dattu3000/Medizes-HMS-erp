import { Router, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { verifyDoctorByPan, getDoctorTdsHistory } from '../services/doctorPortalService';
import { verifyDoctorPortalToken } from '../middlewares/doctorAuthMiddleware';

const router = Router();
const JWT_PORTAL_SECRET = process.env.JWT_PORTAL_SECRET || 'SYS_DR_SECRET_TOKEN_2026';

/**
 * Public Authentication Gateway: Verifies PAN and signs session token
 * POST /api/v1/doctor-portal/auth
 */
router.post('/auth', async (req: Request, res: Response) => {
  const { panNumber } = req.body;

  if (!panNumber || panNumber.length !== 10) {
    return res.status(400).json({ success: false, error: "A valid 10-character alphanumeric PAN is required." });
  }

  try {
    // Look up the practitioner's account status
    const doctor = await verifyDoctorByPan(panNumber);
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        error: "Profile credentials not verified. Contact hospital medical staff operations." 
      });
    }

    // Generate a restricted JWT payload scoped specifically to the doctor portal
    const sessionToken = jwt.sign(
      {
        vendorId: doctor.id,
        panNumber: doctor.panNumber,
        doctorName: doctor.name,
        role: 'EXTERNAL_CONSULTANT'
      },
      JWT_PORTAL_SECRET,
      { expiresIn: '8h' } // Restrict session lifespan for enhanced endpoint security
    );

    return res.status(200).json({
      success: true,
      token: sessionToken,
      doctor: { name: doctor.name, identity: doctor.panNumber }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: "Internal session initialization failure." });
  }
});

/**
 * Read-Optimized Data Retrieval: Fetches professional service (194J) deductions
 * GET /api/v1/doctor-portal/tds-summary
 */
router.get('/tds-summary', verifyDoctorPortalToken, async (req: Request, res: Response) => {
  const targetYear = (req.query.financialYear as string) || '2026-27';
  
  // Guardrail context abstraction extraction
  const sessionPan = req.doctorContext?.panNumber;

  if (!sessionPan) {
    return res.status(403).json({ success: false, error: "Access prohibited: Security footprint mapping failed." });
  }

  try {
    // Force query isolation to match the PAN verified inside the request context
    const historicalPayload = await getDoctorTdsHistory(sessionPan, targetYear);
    
    return res.status(200).json({
      success: true,
      data: historicalPayload
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "Unable to resolve structural tax history lines."
    });
  }
});

export default router;
