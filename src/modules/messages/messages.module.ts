import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesService } from './messages.service.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesController } from './messages.controller.js';
import { PrismaService } from '../../prisma.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
    imports: [
        JwtModule.register({ secret: process.env.SECRET_KEY }),
        NotificationsModule,
    ],
    providers: [MessagesService, MessagesGateway, PrismaService],
    controllers: [MessagesController],
})
export class MessagesModule {}
