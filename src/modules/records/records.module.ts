import { Module } from '@nestjs/common';
import { RecordsService } from './records.service.js';
import { RecordsController } from './records.controller.js';
import { PrismaService } from '../../prisma.service.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
    imports: [CloudinaryModule, NotificationsModule],
    controllers: [RecordsController],
    providers: [RecordsService, PrismaService, CloudinaryService],
})
export class RecordsModule { }
