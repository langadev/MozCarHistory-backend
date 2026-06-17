import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private gateway: NotificationsGateway,
    ) {}

    async create(userId: number, type: string, title: string, body: string, link?: string) {
        const notification = await this.prisma.notification.create({
            data: { userId, type, title, body, link },
        });
        this.gateway.emitToUser(userId, notification);
        return notification;
    }

    async findAll(userId: number) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async countUnread(userId: number): Promise<{ count: number }> {
        const count = await this.prisma.notification.count({ where: { userId, read: false } });
        return { count };
    }

    async markRead(id: number, userId: number) {
        await this.prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
        return { ok: true };
    }

    async markAllRead(userId: number) {
        await this.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
        return { ok: true };
    }

    async remove(id: number, userId: number) {
        await this.prisma.notification.deleteMany({ where: { id, userId } });
        return { ok: true };
    }
}
