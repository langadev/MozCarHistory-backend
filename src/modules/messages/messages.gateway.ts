import {
    WebSocketGateway, WebSocketServer, SubscribeMessage,
    OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service.js';

@WebSocketGateway({
    cors: { origin: '*', credentials: true },
    namespace: '/messages',
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private messagesService: MessagesService,
        private jwtService: JwtService,
    ) {}

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token as string | undefined;
            if (!token) { client.disconnect(); return; }

            const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
            client.data.userId = payload.userId;
            client.join(`user:${payload.userId}`);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(_client: Socket) {}

    @SubscribeMessage('send_message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: number; content: string },
    ) {
        const senderId = client.data.userId as number;
        if (!senderId || !data?.content?.trim() || !data?.receiverId) return;

        const message = await this.messagesService.create(senderId, data.receiverId, data.content.trim());

        // Push to receiver's room
        this.server.to(`user:${data.receiverId}`).emit('new_message', message);

        // Confirm back to sender (for multi-tab / optimistic update)
        return message;
    }

    @SubscribeMessage('mark_read')
    async handleMarkRead(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { senderId: number },
    ) {
        const receiverId = client.data.userId as number;
        if (!receiverId || !data?.senderId) return;

        await this.messagesService.markAsRead(data.senderId, receiverId);

        // Notify sender that their messages were read
        this.server.to(`user:${data.senderId}`).emit('messages_read', { by: receiverId });
    }
}
