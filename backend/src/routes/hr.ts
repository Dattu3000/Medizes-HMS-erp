import { Router } from 'express';
import { markAttendance, getAttendance, getPayroll, generatePayroll, processPayroll } from '../controllers/hrController';
import { getEmployees, getEmployeeProfile, updateEmployeeProfile, uploadHrDocument, signHrDocument, getOrgChart, deployOnboardingWorkflow } from '../controllers/hrCoreController';
import { getJobs, createJob, getCandidates, addCandidate, updateCandidateStatus, scheduleInterview, submitScorecard, analyzeJob } from '../controllers/hrTalentController';
import { getGoals, createGoal, getFeedback, submitFeedback, getOneOnOneAgendas, createOneOnOneAgenda, getActiveSurveys, submitSurveyResponse } from '../controllers/hrPerformanceController';
import { authenticate, requireRole } from '../middlewares/authMiddleware';

const router = Router();

// Define RBAC roles
const adminRoles = ['Super Admin', 'Admin', 'HR Admin', 'HR'];
const mgtRoles = ['Super Admin', 'Admin', 'HR Admin', 'HR', 'Doctor'];

// CORE HRIS
router.get('/employees', authenticate, getEmployees);
router.get('/employees/org-chart', authenticate, getOrgChart);
router.get('/employees/:id', authenticate, getEmployeeProfile);
router.put('/employees/:id', authenticate, requireRole(adminRoles), updateEmployeeProfile);
router.post('/documents', authenticate, requireRole(adminRoles), uploadHrDocument);
router.put('/documents/:id/sign', authenticate, signHrDocument);
router.post('/onboarding/deploy', authenticate, requireRole(mgtRoles), deployOnboardingWorkflow);

// LEGACY (ATTENDANCE & PAYROLL)
router.post('/attendance', authenticate, markAttendance);
router.get('/attendance', authenticate, requireRole(mgtRoles), getAttendance);
router.get('/payroll', authenticate, requireRole(adminRoles), getPayroll);
router.post('/payroll', authenticate, requireRole(adminRoles), generatePayroll);
router.put('/payroll/:id/process', authenticate, requireRole(adminRoles), processPayroll);

// TALENT ACQUISITION
router.get('/jobs', authenticate, getJobs);
router.post('/jobs', authenticate, requireRole(mgtRoles), createJob);
router.post('/jobs/analyze', authenticate, requireRole(mgtRoles), analyzeJob);
router.get('/candidates', authenticate, requireRole(mgtRoles), getCandidates);
router.post('/candidates', authenticate, requireRole(mgtRoles), addCandidate);
router.put('/candidates/:id/status', authenticate, requireRole(mgtRoles), updateCandidateStatus);
router.post('/interviews/schedule', authenticate, requireRole(mgtRoles), scheduleInterview);
router.post('/interviews/scorecard', authenticate, submitScorecard);

// PERFORMANCE & ENGAGEMENT
router.get('/goals', authenticate, getGoals);
router.post('/goals', authenticate, requireRole(mgtRoles), createGoal);
router.get('/feedback', authenticate, getFeedback);
router.post('/feedback', authenticate, submitFeedback);
router.get('/1on1', authenticate, getOneOnOneAgendas);
router.post('/1on1', authenticate, createOneOnOneAgenda);
router.get('/surveys/active', authenticate, getActiveSurveys);
router.post('/surveys/response', authenticate, submitSurveyResponse);

export default router;
