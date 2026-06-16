import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';

const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: { select: { name: true } },
} as const;

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) {}

    async create(senderId: number, receiverId: number, content: string) {
        return this.prisma.message.create({
            data: { senderId, receiverId, content },
            include: {
                sender: { select: USER_SELECT },
                receiver: { select: USER_SELECT },
            },
        });
    }

    async getConversation(userA: number, userB: number) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userA, receiverId: userB },
                    { senderId: userB, receiverId: userA },
                ],
            },
            include: {
                sender: { select: USER_SELECT },
                receiver: { select: USER_SELECT },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getConversations(userId: number) {
        const messages = await this.prisma.message.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            include: {
                sender: { select: USER_SELECT },
                receiver: { select: USER_SELECT },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Group by partner — keep only latest message per partner
        const map = new Map<number, {
            partner: { id: number; name: string | null; email: string; role: string | null };
            lastMessage: typeof messages[0];
            unreadCount: number;
        }>();

        for (const msg of messages) {
            const isOwn = msg.senderId === userId;
            const partnerId = isOwn ? msg.receiverId : msg.senderId;
            const partnerData = isOwn ? msg.receiver : msg.sender;

            if (!map.has(partnerId)) {
                map.set(partnerId, {
                    partner: {
                        id: partnerData.id,
                        name: partnerData.name,
                        email: partnerData.email,
                        role: partnerData.role?.name ?? null,
                    },
                    lastMessage: msg,
                    unreadCount: 0,
                });
            }

            if (!isOwn && !msg.readAt) {
                map.get(partnerId)!.unreadCount++;
            }
        }

        return Array.from(map.values()).sort(
            (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
        );
    }

    async markAsRead(senderId: number, receiverId: number) {
        return this.prisma.message.updateMany({
            where: { senderId, receiverId, readAt: null },
            data: { readAt: new Date() },
        });
    }

    async getUnreadCount(userId: number) {
        return this.prisma.message.count({
            where: { receiverId: userId, readAt: null },
        });
    }
}
