import { Module } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { RolesController } from './roles.controller.js';
import { PrismaService } from '../../prisma.service.js';

@Module({
    controllers: [RolesController],
    providers: [RolesService, PrismaService],
    exports: [RolesService],
})
export class RolesModule { }
