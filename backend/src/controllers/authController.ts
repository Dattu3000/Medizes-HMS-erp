import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../utils/db';
import { logAudit } from '../utils/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req: Request, res: Response) => {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
        return res.status(400).json({ message: 'Employee ID and password required' });
    }

    const user = await prisma.user.findUnique({
        where: { employeeId },
        include: { role: true }
    });

    if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or inactive user' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
        await logAudit(user.id, 'FAILED_LOGIN', { reason: 'Invalid Password' }, req.ip || null);
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If 2FA is required/enabled
    if (user.otpEnabled) {
        // Generate an intermediary token for OTP verification
        const tempToken = jwt.sign({ userId: user.id, isTemp: true }, JWT_SECRET, { expiresIn: '5m' });
        return res.status(200).json({ message: 'OTP Required', tempToken, otpRequired: true });
    }

    // Generate full token
    const token = jwt.sign(
        { userId: user.id, roleId: user.roleId, branchId: user.branchId },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    await logAudit(user.id, 'LOGIN', { method: 'password' }, req.ip || null);

    return res.status(200).json({ token, role: user.role.name, branchId: user.branchId });
};

export const verifyOtp = async (req: Request, res: Response) => {
    const { tempToken, token } = req.body; // tempToken from login, token = 6 digit code

    try {
        const decoded = jwt.verify(tempToken, JWT_SECRET) as any;
        if (!decoded.isTemp) {
            return res.status(401).json({ message: 'Invalid temporary token' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true }
        });

        if (!user || !user.otpSecret) {
            return res.status(400).json({ message: 'User or OTP not set up' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.otpSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            await logAudit(user.id, 'FAILED_LOGIN_OTP', { reason: 'Invalid OTP' }, req.ip || null);
            return res.status(401).json({ message: 'Invalid OTP' });
        }

        const finalToken = jwt.sign(
            { userId: user.id, roleId: user.roleId, branchId: user.branchId },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        await logAudit(user.id, 'LOGIN_OTP', { method: 'otp' }, req.ip || null);

        return res.status(200).json({ token: finalToken, role: user.role.name, branchId: user.branchId });
    } catch (error) {
        return res.status(400).json({ message: 'Token verification failed' });
    }
};

export const generateOtpSetup = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const secret = speakeasy.generateSecret({ name: `Medisys HMS (${user.employeeId})` });

    await prisma.user.update({
        where: { id: userId },
        data: { otpSecret: secret.base32, otpEnabled: true }
    });

    if (secret.otpauth_url) {
        qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
            res.status(200).json({ secret: secret.base32, qrCodeUrl: dataUrl });
        });
    } else {
        res.status(200).json({ secret: secret.base32 });
    }
};
