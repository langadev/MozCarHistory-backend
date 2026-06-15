import {
    Controller, Get, Post, Patch, Body, Param, Query,
    UseGuards, Request, ParseIntPipe, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MechanicsService } from './mechanics.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';

@Controller('mechanics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MechanicsController {
    constructor(
        private mechanicsService: MechanicsService,
        private cloudinaryService: CloudinaryService,
    ) {}

    // --- Workshop endpoints (role: oficina) ---

    @Get()
    @Roles('oficina')
    findAll(
        @Request() req: any,
        @Query('active') active?: string,
    ) {
        const activeBool = active === undefined ? undefined : active === 'true';
        return this.mechanicsService.findAll(req.user.userId, activeBool);
    }

    @Post()
    @Roles('oficina')
    @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
    async create(
        @Request() req: any,
        @Body() dto: CreateMechanicDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        let photoUrl: string | undefined;
        if (file) {
            const result = await this.cloudinaryService.uploadFile(file);
            photoUrl = (result as any).secure_url;
        }
        return this.mechanicsService.create(req.user.userId, dto, photoUrl);
    }

    @Patch(':id')
    @Roles('oficina')
    @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
    async update(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() body: Partial<Omit<CreateMechanicDto, 'email' | 'password'>>,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        let photoUrl: string | undefined;
        if (file) {
            const result = await this.cloudinaryService.uploadFile(file);
            photoUrl = (result as any).secure_url;
        }
        return this.mechanicsService.update(id, req.user.userId, { ...body, ...(photoUrl ? { photo: photoUrl } : {}) });
    }

    @Patch(':id/status')
    @Roles('oficina')
    updateStatus(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body('active') active: boolean,
    ) {
        return this.mechanicsService.updateStatus(id, req.user.userId, active);
    }

    // --- Mechanic endpoints (role: mecanico) ---

    @Get('me')
    @Roles('mecanico')
    getMe(@Request() req: any) {
        return this.mechanicsService.findByUserId(req.user.userId);
    }

    @Get('me/vehicles')
    @Roles('mecanico')
    getMyVehicles(@Request() req: any) {
        return this.mechanicsService.findVehiclesByMechanic(req.user.userId);
    }

    @Get('me/records')
    @Roles('mecanico')
    getMyRecords(@Request() req: any) {
        return this.mechanicsService.findMyRecords(req.user.userId);
    }
}
