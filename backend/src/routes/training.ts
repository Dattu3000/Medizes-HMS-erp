import { Router } from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import {
    getRecommendedCourses,
    getMyEnrollments,
    enrollInCourse,
    updateProgress,
    seedCourses
} from '../controllers/trainingController';

const router = Router();

// Staff/Manager facing endpoints
router.get('/recommendations', authenticate, getRecommendedCourses);
router.get('/my-enrollments', authenticate, getMyEnrollments);
router.post('/enroll', authenticate, enrollInCourse);
router.put('/progress/:enrollmentId', authenticate, updateProgress);

// Admin / Demo endpoints
router.post('/seed', authenticate, seedCourses);

export default router;
