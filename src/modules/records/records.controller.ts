import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecordsService } from './records.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateRecordDto } from './dto/create-record.dto.js';

@ApiTags('maintenance')
@Controller('maintenance')
export class RecordsController {
    constructor(
        private readonly recordsService: RecordsService,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Registar novo serviço de manutenção' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Registo de manutenção criado com sucesso.' })
    @ApiResponse({ status: 400, description: 'Viatura ou oficina não encontrada.' })
    @ApiResponse({ status: 401, description: 'Token inválido ou ausente.' })
    @UseInterceptors(FilesInterceptor('photos', 5, { storage: memoryStorage() }))
    async create(@Body() body: CreateRecordDto, @UploadedFiles() files: Express.Multer.File[]) {
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
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar registos de manutenção de uma oficina' })
    @ApiParam({ name: 'id', type: 'number', description: 'ID da oficina', example: 2 })
    @ApiResponse({ status: 200, description: 'Lista de registos da oficina com dados da viatura.' })
    async findByWorkshopId(@Param('id') id: string) {
        return this.recordsService.findByWorkshopId(+id);
    }

    @Get('all-vehicles')
    @ApiOperation({ summary: 'Listar todas as viaturas com o último registo de manutenção' })
    @ApiResponse({ status: 200, description: 'Lista de viaturas com resumo do último serviço.' })
    async findAllVehicles() {
        return this.recordsService.findAllUniqueVehicles();
    }

    @Get('search')
    @ApiOperation({ summary: 'Pesquisar histórico de manutenção por matrícula ou VIN' })
    @ApiQuery({ name: 'plate', required: false, description: 'Matrícula da viatura', example: 'MP-12-34-AB' })
    @ApiQuery({ name: 'vin', required: false, description: 'Número VIN da viatura', example: '1HGBH41JXMN109186' })
    @ApiResponse({ status: 200, description: 'Registos de manutenção encontrados.' })
    async search(@Query('plate') plate?: string, @Query('vin') vin?: string) {
        if (plate) {
            return this.recordsService.findByPlateNumber(plate);
        }
        if (vin) {
            return this.recordsService.findByVin(vin);
        }
        return [];
    }
}
