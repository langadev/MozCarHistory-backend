import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { NotificationsController } from './notifications.controller.js';
import { PrismaService } from '../../prisma.service.js';

@Module({
    imports: [JwtModule.register({ secret: process.env.SECRET_KEY })],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsGateway, PrismaService],
    exports: [NotificationsService],
})
export class NotificationsModule {}
