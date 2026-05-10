export const calculateEWS = (vitals: {
  heartRate?: number | null;
  respiratoryRate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  bp?: string | null;
}): { score: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' } => {
  let score = 0;

  // Heart Rate
  if (vitals.heartRate) {
    if (vitals.heartRate <= 40 || vitals.heartRate >= 131) score += 3;
    else if (vitals.heartRate >= 111 && vitals.heartRate <= 130) score += 2;
    else if (vitals.heartRate <= 50 || (vitals.heartRate >= 91 && vitals.heartRate <= 110)) score += 1;
  }

  // Respiratory Rate
  if (vitals.respiratoryRate) {
    if (vitals.respiratoryRate <= 8 || vitals.respiratoryRate >= 25) score += 3;
    else if (vitals.respiratoryRate >= 21 && vitals.respiratoryRate <= 24) score += 2;
    else if (vitals.respiratoryRate >= 9 && vitals.respiratoryRate <= 11) score += 1;
  }

  // Temperature (Celsius)
  if (vitals.temperature) {
    if (vitals.temperature <= 35.0) score += 3;
    else if (vitals.temperature >= 39.1) score += 2;
    else if (vitals.temperature <= 36.0 || (vitals.temperature >= 38.1 && vitals.temperature <= 39.0)) score += 1;
  }

  // SpO2
  if (vitals.spo2) {
    if (vitals.spo2 <= 91) score += 3;
    else if (vitals.spo2 >= 92 && vitals.spo2 <= 93) score += 2;
    else if (vitals.spo2 >= 94 && vitals.spo2 <= 95) score += 1;
  }

  // BP (Systolic)
  if (vitals.bp) {
    const sys = parseInt(vitals.bp.split('/')[0]);
    if (!isNaN(sys)) {
      if (sys <= 90 || sys >= 220) score += 3;
      else if (sys >= 91 && sys <= 100) score += 2;
      else if (sys >= 101 && sys <= 110) score += 1;
    }
  }

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (score >= 7) riskLevel = 'CRITICAL';
  else if (score >= 5) riskLevel = 'HIGH';
  else if (score >= 3) riskLevel = 'MEDIUM';

  return { score, riskLevel };
};
