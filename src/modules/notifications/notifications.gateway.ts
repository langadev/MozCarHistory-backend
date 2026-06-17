import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(private jwtService: JwtService) {}

    afterInit(server: Server) {
        server.use((client: Socket, next) => {
            try {
                const token = client.handshake.auth?.token as string | undefined;
                if (!token) return next(new Error('NO_TOKEN'));
                const payload = this.jwtService.verify(token, { secret: process.env.SECRET_KEY });
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
        client.join(`notif:${client.data.userId}`);
    }

    emitToUser(userId: number, notification: object) {
        this.server?.to(`notif:${userId}`).emit('notification', notification);
    }
}
