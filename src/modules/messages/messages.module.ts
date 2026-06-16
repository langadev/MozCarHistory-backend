import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesService } from './messages.service.js';
import { MessagesGateway } from './messages.gateway.js';
import { MessagesController } from './messages.controller.js';
import { PrismaService } from '../../prisma.service.js';

@Module({
    imports: [
        JwtModule.register({ secret: process.env.JWT_SECRET }),
    ],
    providers: [MessagesService, MessagesGateway, PrismaService],
    controllers: [MessagesController],
})
export class MessagesModule {}
