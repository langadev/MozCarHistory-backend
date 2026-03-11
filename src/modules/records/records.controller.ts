import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
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
                plateNumber: body.plateNumber,
                vin: body.vin,
                brandModel: body.brandModel,
                mileage: Number(body.mileage),
                description: body.description,
                parts: body.parts,
                mechanic: body.mechanic,
                workshopId: Number(body.workshopId),
                photos
            };

            console.log('Final data for Prisma:', data);

            return await this.recordsService.create(data);
        } catch (error) {
            console.error('Error creating record:', error);
            throw error;
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
