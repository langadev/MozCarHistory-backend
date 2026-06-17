import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../../prisma.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
    imports: [NotificationsModule],
    controllers: [AdminController],
    providers: [AdminService, PrismaService],
})
export class AdminModule {}
