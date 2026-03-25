import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';
import { analyzeJobDescription } from '../utils/aiService';

// Job Definitions
export const getJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.jobDefinition.findMany({ include: { hiringManager: true, _count: { select: { candidates: true } } } });
        res.status(200).json(jobs);
    } catch (error) { res.status(500).json({ message: 'Error fetching jobs', error }); }
};

export const createJob = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const job = await prisma.jobDefinition.create({ data });
        res.status(201).json(job);
    } catch (error) { res.status(500).json({ message: 'Error creating job', error }); }
};

export const analyzeJob = async (req: Request, res: Response) => {
    try {
        const { description } = req.body;
        // Execute AI Job Description logic
        const aiAnalysis = await analyzeJobDescription(description);
        res.status(200).json(aiAnalysis);
    } catch (error) { res.status(500).json({ message: 'Error analyzing job', error }); }
};

// Candidates
export const getCandidates = async (req: Request, res: Response) => {
    try {
        const candidates = await prisma.candidate.findMany({ include: { job: true, interviews: true, scorecards: true } });
        res.status(200).json(candidates);
    } catch (error) { res.status(500).json({ message: 'Error fetching candidates', error }); }
};

export const addCandidate = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const candidate = await prisma.candidate.create({ data });
        res.status(201).json(candidate);
    } catch (error) { res.status(500).json({ message: 'Error adding candidate', error }); }
};

export const updateCandidateStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const candidate = await prisma.candidate.update({ where: { id: String(id) }, data: { status } });
        res.status(200).json(candidate);
    } catch (error) { res.status(500).json({ message: 'Error updating candidate', error }); }
};

// Interviews & Scheduling
export const scheduleInterview = async (req: Request, res: Response) => {
    try {
        const { candidateId, interviewerIds, scheduledAt, durationMins } = req.body;

        // Ensure interviewerIds is an array
        const interviewers = Array.isArray(interviewerIds) ? interviewerIds : [interviewerIds];

        const slots = await Promise.all(interviewers.map(interviewerId =>
            prisma.interviewSlot.create({
                data: { candidateId, interviewerId, scheduledAt: new Date(scheduledAt), durationMins, meetingLink: "https://meet.gudhr.com/" + candidateId }
            })
        ));

        res.status(201).json({ message: "Interview scheduled across panel", slots });
    } catch (error) { res.status(500).json({ message: 'Error scheduling interview', error }); }
};

export const submitScorecard = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const scorecard = await prisma.interviewScorecard.create({ data });
        res.status(201).json(scorecard);
    } catch (error) { res.status(500).json({ message: 'Error submitting scorecard', error }); }
};
