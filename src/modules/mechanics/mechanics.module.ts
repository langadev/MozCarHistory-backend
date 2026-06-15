import { Module } from '@nestjs/common';
import { MechanicsController } from './mechanics.controller.js';
import { MechanicsService } from './mechanics.service.js';
import { PrismaService } from '../../prisma.service.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Module({
    imports: [CloudinaryModule],
    controllers: [MechanicsController],
    providers: [MechanicsService, PrismaService, CloudinaryService],
})
export class MechanicsModule {}
