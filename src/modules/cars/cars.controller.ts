import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CarsService } from './cars.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Controller('cars')
export class CarsController {
    constructor(
        private readonly carsService: CarsService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post()
    @UseInterceptors(FilesInterceptor('photos', 5, { storage: memoryStorage() }))
    async create(@Body() body: any, @UploadedFiles() files: Express.Multer.File[]) {
        try {
            let photos: string[] = [];
            if (files && files.length > 0) {
                const uploadResults = await this.cloudinaryService.uploadMultiple(files);
                photos = uploadResults.map(res => res.secure_url);
            }

            return await this.carsService.create({
                plateNumber: body.plateNumber,
                vin: body.vin,
                brandModel: body.brandModel,
                ownerId: body.ownerId ? Number(body.ownerId) : null,
                photos,
            });
        } catch (error: any) {
            console.error("CARS CREATION ERROR:", error);
            const msg = error.message || JSON.stringify(error);
            if (msg.includes('Foreign key constraint violated')) {
                throw new BadRequestException("Utilizador não encontrado (Sessão expirada ou BD limpa). Por favor, termine a sessão e faça login denovo.");
            }
            if (msg.includes('Unique constraint failed')) {
                throw new BadRequestException("Esta viatura já se encontra registada.");
            }
            throw new BadRequestException(msg);
        }
    }

    @Get()
    async findAll(@Query('plate') plate?: string) {
        if (plate) {
            const car = await this.carsService.findByPlateNumber(plate);
            return car ? [car] : [];
        }
        return this.carsService.findAll();
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.carsService.findById(Number(id));
    }
}
