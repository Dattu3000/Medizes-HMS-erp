import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';
import { analyzeSurveySentiment } from '../utils/aiService';

// Goals / OKRs
export const getGoals = async (req: Request, res: Response) => {
    try {
        const goals = await prisma.goal.findMany({ include: { owner: { select: { firstName: true, lastName: true } }, subGoals: true, parentGoal: true } });
        res.status(200).json(goals);
    } catch (error) { res.status(500).json({ message: 'Error fetching goals', error }); }
};

export const createGoal = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const goal = await prisma.goal.create({ data });
        res.status(201).json(goal);
    } catch (error) { res.status(500).json({ message: 'Error creating goal', error }); }
};

// Feedback
export const getFeedback = async (req: Request, res: Response) => {
    try {
        const { toUserId } = req.query;
        const filters = toUserId ? { toUserId: String(toUserId) } : {};
        const feedback = await prisma.feedback.findMany({
            where: filters,
            include: { fromUser: { select: { firstName: true, lastName: true, department: true } } }
        });
        res.status(200).json(feedback);
    } catch (error) { res.status(500).json({ message: 'Error fetching feedback', error }); }
};

export const submitFeedback = async (req: Request, res: Response) => {
    try {
        const { fromUserId, toUserId, content, type } = req.body;
        const feedback = await prisma.feedback.create({
            data: { fromUserId, toUserId, content, type }
        });
        res.status(201).json(feedback);
    } catch (error) { res.status(500).json({ message: 'Error submitting feedback', error }); }
};

// 1:1 Agendas
export const getOneOnOneAgendas = async (req: Request, res: Response) => {
    try {
        const { managerId, employeeId } = req.query;
        const filters: any = {};
        if (managerId) filters.managerId = String(managerId);
        if (employeeId) filters.employeeId = String(employeeId);

        const agendas = await prisma.oneOnOneAgenda.findMany({
            where: filters,
            include: { employee: { select: { firstName: true, lastName: true } }, manager: { select: { firstName: true, lastName: true } } },
            orderBy: { date: 'desc' }
        });
        res.status(200).json(agendas);
    } catch (error) { res.status(500).json({ message: 'Error fetching agendas', error }); }
};

export const createOneOnOneAgenda = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const agenda = await prisma.oneOnOneAgenda.create({ data });
        res.status(201).json(agenda);
    } catch (error) { res.status(500).json({ message: 'Error creating agenda', error }); }
};

// Surveys
export const getActiveSurveys = async (req: Request, res: Response) => {
    try {
        const surveys = await prisma.survey.findMany({
            where: { status: 'ACTIVE' },
            include: { _count: { select: { responses: true } } }
        });
        res.status(200).json(surveys);
    } catch (error) { res.status(500).json({ message: 'Error fetching surveys', error }); }
};

export const submitSurveyResponse = async (req: Request, res: Response) => {
    try {
        const { surveyId, answers } = req.body;

        // Extract free text strings from answers to analyze sentiment
        const freeTextResponses: string[] = [];
        if (Array.isArray(answers)) {
            answers.forEach((ans: any) => {
                if (typeof ans.answer === 'string') freeTextResponses.push(ans.answer);
            });
        }

        // Perform AI sentiment analysis on the free text responses
        const aiAnalysis = await analyzeSurveySentiment(freeTextResponses);

        const response = await prisma.surveyResponse.create({
            data: { surveyId, answers, sentiment: aiAnalysis.sentiment }
        });
        res.status(201).json({ response, aiSentimentScore: aiAnalysis.score });
    } catch (error) { res.status(500).json({ message: 'Error submitting survey response', error }); }
};
