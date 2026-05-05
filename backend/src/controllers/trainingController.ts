import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { callGemma } from '../utils/aiService';

export const getRecommendedCourses = async (req: Request, res: Response) => {
    try {
        const employeeId = (req as any).user.employeeId;

        const employee = await prisma.employee.findFirst({
            where: { user: { employeeId: employeeId } } // Depending on how user is mapped to employee
        });

        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const courses = await prisma.course.findMany();

        // Filter out already enrolled courses for recommendations
        const enrolled = await prisma.courseEnrollment.findMany({
            where: { employeeId: employee.id },
            select: { courseId: true }
        });
        const enrolledIds = enrolled.map((e: any) => e.courseId);

        const availableCourses = courses.filter((c: any) => !enrolledIds.includes(c.id));

        if (availableCourses.length === 0) {
            return res.status(200).json({ recommendations: [] });
        }

        // --- GEMMA AI INTEGRATION ---
        const courseDataSubset = availableCourses.map((c: any) => ({
            id: c.id, title: c.title, department: c.department, tags: c.tags
        }));

        const prompt = `You are an AI HR Training assistant. Based on an employee with Designation: "${employee.designation || 'Staff'}" and Department: "${employee.department || 'General'}", score and recommend learning paths from the provided JSON list. 
        Return ONLY a valid JSON array exactly matching this format: [{"id": "course-id", "aiMatchScore": 85, "aiSuggested": true}].
        Do NOT wrap the JSON in Markdown formatting like \`\`\`json. Return pure JSON array only.
        
        Courses Array:
        ${JSON.stringify(courseDataSubset)}`;

        try {
            const aiSuggestions = await callGemma(prompt);

            // Merge AI scores into the actual course objects
            const recommendations = availableCourses.map((c: any) => {
                const suggestion = aiSuggestions.find((s: any) => s.id === c.id);
                return {
                    ...c,
                    aiMatchScore: suggestion?.aiMatchScore || 50,
                    aiSuggested: suggestion?.aiSuggested || false
                };
            }).sort((a: any, b: any) => b.aiMatchScore - a.aiMatchScore);

            return res.status(200).json({ recommendations });
        } catch (aiError) {
            console.error("Gemma API Error:", aiError);
            // Fallback to basic if API fails
            const fallback = availableCourses.map((c: any) => ({
                ...c, aiMatchScore: 50, aiSuggested: false
            }));
            return res.status(200).json({ recommendations: fallback, fallback: true });
        }

    } catch (error) {
        res.status(500).json({ message: 'Error fetching AI recommendations', error });
    }
};

export const getMyEnrollments = async (req: Request, res: Response) => {
    try {
        const employeeId = (req as any).user.employeeId;
        const employee = await prisma.employee.findFirst({
            where: { user: { employeeId: employeeId } }
        });

        if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

        const enrollments = await prisma.courseEnrollment.findMany({
            where: { employeeId: employee.id },
            include: { course: true }
        });

        res.status(200).json({ enrollments });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching enrollments', error });
    }
};

export const enrollInCourse = async (req: Request, res: Response) => {
    try {
        const employeeId = (req as any).user.employeeId;
        const { courseId } = req.body;

        const employee = await prisma.employee.findFirst({
            where: { user: { employeeId: employeeId } }
        });

        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        const newEnrollment = await prisma.courseEnrollment.create({
            data: {
                courseId,
                employeeId: employee.id,
                status: 'IN_PROGRESS',
                aiSuggested: req.body.aiSuggested || false,
                matchScore: req.body.matchScore || null
            }
        });

        res.status(201).json({ message: 'Enrolled successfully', enrollment: newEnrollment });
    } catch (error) {
        res.status(500).json({ message: 'Error enrolling in course', error });
    }
};

export const updateProgress = async (req: Request, res: Response) => {
    try {
        const { enrollmentId } = req.params;
        const { progress } = req.body;

        const existing = await prisma.courseEnrollment.findUnique({
            where: { id: String(enrollmentId) }
        });

        if (!existing) return res.status(404).json({ message: 'Enrollment not found' });

        const newStatus = progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
        const completionDate = progress >= 100 ? new Date() : null;

        const updated = await prisma.courseEnrollment.update({
            where: { id: String(enrollmentId) },
            data: {
                progress,
                status: newStatus,
                completionDate: completionDate ?? existing.completionDate
            }
        });

        res.status(200).json({ message: 'Progress updated', enrollment: updated });
    } catch (error) {
        res.status(500).json({ message: 'Error updating course progress', error });
    }
};

// Seed initial learning data if DB is empty
export const seedCourses = async (req: Request, res: Response) => {
    try {
        const count = await prisma.course.count();
        if (count === 0) {
            await prisma.course.createMany({
                data: [
                    {
                        title: 'Advanced Life Support (ALS)',
                        description: 'Detailed training on adult advanced life support.',
                        department: 'Nursing',
                        tags: ['nurse', 'paramedic', 'er'],
                        modules: [{ title: 'Intro to ALS', duration: 30 }, { title: 'Defibrillation', duration: 45 }],
                        requiredFor: ['ER_NURSE']
                    },
                    {
                        title: 'Hospital Management & Ethics',
                        description: 'Core ethics and management protocols for healthcare staff.',
                        department: 'General',
                        tags: ['management', 'ethics', 'all'],
                        modules: [{ title: 'Code of Conduct', duration: 20 }, { title: 'Patient Data Privacy', duration: 25 }],
                        requiredFor: []
                    },
                    {
                        title: 'Pharmacy: Stock Reconciliation',
                        description: 'Effective tracking of medical supply inventory.',
                        department: 'Pharmacy',
                        tags: ['pharmacist', 'inventory'],
                        modules: [{ title: 'Batch Tracking', duration: 15 }, { title: 'Expiry Yield', duration: 20 }],
                        requiredFor: ['PHARMACIST']
                    }
                ]
            });
            return res.status(200).json({ message: 'Courses seeded successfully' });
        }
        res.status(200).json({ message: 'Courses already exist' });
    } catch (error) {
        res.status(500).json({ message: 'Error seeding courses', error });
    }
};
