import { Router } from 'express';
import { markAttendance, getAttendance, getPayroll, generatePayroll, processPayroll } from '../controllers/hrController';
import { getEmployees, getEmployeeProfile, updateEmployeeProfile, uploadHrDocument, signHrDocument, getOrgChart } from '../controllers/hrCoreController';
import { getJobs, createJob, getCandidates, addCandidate, updateCandidateStatus, scheduleInterview, submitScorecard } from '../controllers/hrTalentController';
import { getGoals, createGoal, getFeedback, submitFeedback, getOneOnOneAgendas, createOneOnOneAgenda, getActiveSurveys, submitSurveyResponse } from '../controllers/hrPerformanceController';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// CORE HRIS
router.get('/employees', authenticate, getEmployees);
router.get('/employees/org-chart', authenticate, getOrgChart);
router.get('/employees/:id', authenticate, getEmployeeProfile);
router.put('/employees/:id', authenticate, updateEmployeeProfile);
router.post('/documents', authenticate, uploadHrDocument);
router.put('/documents/:id/sign', authenticate, signHrDocument);

// LEGACY (ATTENDANCE & PAYROLL)
router.post('/attendance', authenticate, markAttendance);
router.get('/attendance', authenticate, getAttendance);
router.get('/payroll', authenticate, getPayroll);
router.post('/payroll', authenticate, generatePayroll);
router.put('/payroll/:id/process', authenticate, processPayroll);

// TALENT ACQUISITION
router.get('/jobs', authenticate, getJobs);
router.post('/jobs', authenticate, createJob);
router.get('/candidates', authenticate, getCandidates);
router.post('/candidates', authenticate, addCandidate);
router.put('/candidates/:id/status', authenticate, updateCandidateStatus);
router.post('/interviews/schedule', authenticate, scheduleInterview);
router.post('/interviews/scorecard', authenticate, submitScorecard);

// PERFORMANCE & ENGAGEMENT
router.get('/goals', authenticate, getGoals);
router.post('/goals', authenticate, createGoal);
router.get('/feedback', authenticate, getFeedback);
router.post('/feedback', authenticate, submitFeedback);
router.get('/1on1', authenticate, getOneOnOneAgendas);
router.post('/1on1', authenticate, createOneOnOneAgenda);
router.get('/surveys/active', authenticate, getActiveSurveys);
router.post('/surveys/response', authenticate, submitSurveyResponse);

export default router;
