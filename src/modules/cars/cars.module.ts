import { Module } from '@nestjs/common';
import { CarsController } from './cars.controller.js';
import { CarsService } from './cars.service.js';
import { PrismaService } from '../../prisma.service.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Module({
    imports: [CloudinaryModule],
    controllers: [CarsController],
    providers: [CarsService, PrismaService, CloudinaryService],
    exports: [CarsService]
})
export class CarsModule { }
