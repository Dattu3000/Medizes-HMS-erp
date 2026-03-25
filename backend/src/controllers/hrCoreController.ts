import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

// Get All Employees / Directory
export const getEmployees = async (req: Request, res: Response) => {
    try {
        const employees = await prisma.employee.findMany({
            include: { user: { select: { email: true, role: true } }, manager: true }
        });
        // Refetched nicely
        const cleanEmployees = await prisma.employee.findMany({
            include: { user: { select: { email: true, role: true } }, manager: true }
        });
        res.status(200).json(cleanEmployees);
    } catch (error) { res.status(500).json({ message: 'Error fetching employees', error }); }
};

// Get Employee Profile
export const getEmployeeProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const employee = await prisma.employee.findUnique({
            where: { id: String(id) },
            include: {
                user: { select: { email: true, role: true, isActive: true } },
                manager: true,
                directReports: true,
                hrDocuments: true,
                onboardingTasks: true
            }
        });
        if (!employee) return res.status(404).json({ message: "Employee not found" });
        res.status(200).json(employee);
    } catch (error) { res.status(500).json({ message: 'Error fetching profile', error }); }
};

// Update Employee Profile
export const updateEmployeeProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updated = await prisma.employee.update({
            where: { id: String(id) },
            data
        });
        res.status(200).json(updated);
    } catch (error) { res.status(500).json({ message: 'Error updating profile', error }); }
};

// Upload HR Document
export const uploadHrDocument = async (req: Request, res: Response) => {
    try {
        const { employeeId, title, url, type } = req.body;
        const doc = await prisma.hrDocument.create({
            data: { employeeId, title, url, type, status: 'PENDING' }
        });
        res.status(201).json(doc);
    } catch (error) { res.status(500).json({ message: 'Error adding document', error }); }
};

// Sign HR Document
export const signHrDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const doc = await prisma.hrDocument.update({
            where: { id: String(id) },
            data: { status: 'SIGNED' }
        });
        res.status(200).json(doc);
    } catch (error) { res.status(500).json({ message: 'Error signing document', error }); }
};

// Get Org Chart Data
export const getOrgChart = async (req: Request, res: Response) => {
    try {
        const employees = await prisma.employee.findMany({
            select: { id: true, firstName: true, lastName: true, designation: true, department: true, managerId: true, user: { select: { email: true } } }
        });
        res.status(200).json(employees);
    } catch (error) { res.status(500).json({ message: 'Error fetching org chart', error }); }
};
