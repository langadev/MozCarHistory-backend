import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CarsService } from './cars.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
    constructor(
        private readonly carsService: CarsService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Registar nova viatura' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['plateNumber', 'brandModel'],
            properties: {
                plateNumber: { type: 'string', example: 'MP-12-34-AB' },
                vin: { type: 'string', example: '1HGBH41JXMN109186' },
                brandModel: { type: 'string', example: 'Toyota Hilux 2020' },
                ownerId: { type: 'number', example: 1 },
                photos: { type: 'array', items: { type: 'string', format: 'binary' } },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Viatura registada com sucesso.' })
    @ApiResponse({ status: 400, description: 'Viatura já registada ou utilizador não encontrado.' })
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
    @ApiOperation({ summary: 'Listar todas as viaturas (ou filtrar por matrícula)' })
    @ApiQuery({ name: 'plate', required: false, description: 'Matrícula exacta para filtrar', example: 'MP-12-34-AB' })
    @ApiResponse({ status: 200, description: 'Lista de viaturas.' })
    async findAll(@Query('plate') plate?: string) {
        if (plate) {
            const car = await this.carsService.findByPlateNumber(plate);
            return car ? [car] : [];
        }
        return this.carsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter viatura por ID (com histórico de manutenção)' })
    @ApiParam({ name: 'id', type: 'number', description: 'ID da viatura', example: 1 })
    @ApiResponse({ status: 200, description: 'Dados da viatura com registos de manutenção.' })
    @ApiResponse({ status: 404, description: 'Viatura não encontrada.' })
    async findById(@Param('id') id: string) {
        return this.carsService.findById(Number(id));
    }
}
