import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';
import crypto from 'crypto';

export const createEmployeeUser = async (req: Request, res: Response) => {
    const { firstName, lastName, email, roleId, branchId, department, designation } = req.body;
    const adminUserId = (req as any).user.id;

    try {
        // Basic validation
        if (!firstName || !lastName || !roleId || !branchId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Role check
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Branch check
        const branch = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        // Auto-generate employee ID (e.g. EMP-2026-XXXX)
        const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
        const employeeId = `EMP-${new Date().getFullYear()}-${randomHex}`;

        // Auto-generate temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex');
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    employeeId,
                    email,
                    passwordHash,
                    roleId,
                    branchId,
                    otpEnabled: false, // forces setup on first login or keep disabled
                    employee: {
                        create: {
                            firstName,
                            lastName,
                            department,
                            designation,
                        }
                    }
                },
                include: {
                    employee: true
                }
            });

            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: 'CREATED_EMPLOYEE',
                    details: JSON.stringify({ newEmployeeId: employeeId, role: role.name }),
                    ipAddress: req.ip || null
                }
            });

            return user;
        });

        res.status(201).json({
            message: 'Employee created successfully',
            employeeId: newUser.employeeId,
            tempPassword,
            employeeDetails: newUser.employee
        });

    } catch (error) {
        res.status(500).json({ message: 'Failed to create employee', error });
    }
};

export const getSystemMetadata = async (req: Request, res: Response) => {
    try {
        const roles = await prisma.role.findMany();
        const branches = await prisma.branch.findMany();
        res.status(200).json({ roles, branches });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch system metadata', error });
    }
};
