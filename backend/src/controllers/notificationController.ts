import { Request, Response } from 'express';
import { prisma } from '../utils/db';

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const notifications = await prisma.notification.findMany({
            where: { targetUserId: userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: String(id) },
            data: { isRead: true }
        });
        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notification', error });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await prisma.notification.updateMany({
            where: { targetUserId: userId, isRead: false },
            data: { isRead: true }
        });
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark all notifications', error });
    }
};
