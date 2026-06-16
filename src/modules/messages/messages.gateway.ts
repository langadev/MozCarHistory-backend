import {
    WebSocketGateway, WebSocketServer, SubscribeMessage,
    OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
    ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from './messages.service.js';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/messages',
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private messagesService: MessagesService,
        private jwtService: JwtService,
    ) {}

    // Use Socket.IO middleware so auth failures send CONNECT_ERROR (not DISCONNECT).
    // This prevents the client from being stuck in a silent reconnection loop.
    afterInit(server: Server) {
        server.use((client: Socket, next) => {
            try {
                const token = client.handshake.auth?.token as string | undefined;
                if (!token) return next(new Error('NO_TOKEN'));

                const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
                const userId = (payload.sub ?? payload.userId) as number | undefined;
                if (!userId) return next(new Error('INVALID_PAYLOAD'));

                client.data.userId = userId;
                next();
            } catch (err: any) {
                next(new Error(err?.message ?? 'AUTH_ERROR'));
            }
        });
    }

    handleConnection(client: Socket) {
        // Auth already verified by middleware; just join the user room.
        client.join(`user:${client.data.userId}`);
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

        this.server.to(`user:${data.receiverId}`).emit('new_message', message);
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
        this.server.to(`user:${data.senderId}`).emit('messages_read', { by: receiverId });
    }
}
