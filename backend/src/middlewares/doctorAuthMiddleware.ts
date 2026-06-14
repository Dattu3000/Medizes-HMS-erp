import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_PORTAL_SECRET = process.env.JWT_PORTAL_SECRET || 'SYS_DR_SECRET_TOKEN_2026';

export interface DoctorTokenPayload {
  vendorId: string;
  panNumber: string;
  doctorName: string;
  role: 'EXTERNAL_CONSULTANT';
}

declare global {
  namespace Express {
    interface Request {
      doctorContext?: DoctorTokenPayload;
    }
  }
}

export function verifyDoctorPortalToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: "Access Denied: Missing auth token." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_PORTAL_SECRET) as DoctorTokenPayload;
    if (decoded.role !== 'EXTERNAL_CONSULTANT') {
      throw new Error("Invalid token scope application.");
    }
    
    // Inject identity metadata securely into the active request context
    req.doctorContext = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: "Session expired or invalid authentication token signatures." });
  }
}
