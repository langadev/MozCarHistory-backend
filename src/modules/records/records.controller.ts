import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecordsService } from './records.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Controller('maintenance')
export class RecordsController {
    constructor(
        private readonly recordsService: RecordsService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 5, { storage: memoryStorage() }))
    async create(@Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
        try {
            console.log('Receiving record:', body);
            console.log('Files count:', files?.length || 0);

            let photos: string[] = [];

            if (files && files.length > 0) {
                const uploadResults = await this.cloudinaryService.uploadMultiple(files);
                photos = uploadResults.map(res => res.secure_url);
                console.log('Uploaded photos:', photos);
            }

            const data = {
                carId: Number(body.carId),
                mileage: Number(body.mileage),
                description: body.description,
                parts: body.parts,
                mechanic: body.mechanic,
                workshopId: Number(body.workshopId),
                photos
            };

            console.log('Final data for Prisma:', data);

            return await this.recordsService.create(data);
        } catch (error: any) {
            console.error('Error creating record:', error);
            const msg = error.message || JSON.stringify(error);

            if (msg.includes('Foreign key constraint violated on the constraint: `MaintenanceRecord_workshopId_fkey`')) {
                throw new BadRequestException("Oficina não encontrada. Por favor, faça login novamente.");
            }
            if (msg.includes('Foreign key constraint violated on the constraint: `MaintenanceRecord_carId_fkey`')) {
                throw new BadRequestException("Viatura não encontrada no sistema. Por favor, registe-a primeiro.");
            }

            throw new BadRequestException("Erro ao registar serviço: " + (error.message || "Verifique os dados."));
        }
    }

    @Get('workshop/:id')
    async findByWorkshopId(@Param('id') id: string) {
        return this.recordsService.findByWorkshopId(+id);
    }

    @Get('search')
    async search(@Query('plate') plate?: string, @Query('vin') vin?: string) {
        if (plate) {
            return this.recordsService.findByPlateNumber(plate);
        }
        if (vin) {
            return this.recordsService.findByVin(vin);
        }
        return [];
    }

    @Get('all-vehicles')
    async findAllVehicles() {
        return this.recordsService.findAllUniqueVehicles();
    }
}
