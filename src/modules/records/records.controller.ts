import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFiles, BadRequestException, ForbiddenException, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RecordsService } from './records.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { PrismaService } from '../../prisma.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { VerifiedGuard } from '../auth/verified.guard.js';
import { CreateRecordDto } from './dto/create-record.dto.js';
import { UpdateRecordDto } from './dto/update-record.dto.js';

@ApiTags('maintenance')
@Controller('maintenance')
export class RecordsController {
    constructor(
        private readonly recordsService: RecordsService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly prisma: PrismaService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard, VerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Registar novo serviço de manutenção' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Registo de manutenção criado com sucesso.' })
    @ApiResponse({ status: 400, description: 'Viatura ou oficina não encontrada.' })
    @ApiResponse({ status: 401, description: 'Token inválido ou ausente.' })
    @UseInterceptors(FilesInterceptor('photos', 5, { storage: memoryStorage() }))
    async create(@Request() req: any, @Body() body: CreateRecordDto, @UploadedFiles() files: Express.Multer.File[]) {
        try {
            console.log('Receiving record:', body);
            console.log('Files count:', files?.length || 0);

            let photos: string[] = [];

            if (files && files.length > 0) {
                const uploadResults = await this.cloudinaryService.uploadMultiple(files);
                photos = uploadResults.map(res => res.secure_url);
                console.log('Uploaded photos:', photos);
            }

            let workshopId = Number(body.workshopId);
            let mechanicId = body.mechanicId ? Number(body.mechanicId) : undefined;

            // When a mechanic registers a service, infer workshopId and mechanicId from their profile
            if (req.user?.role === 'mecanico') {
                const mechanic = await this.prisma.mechanic.findUnique({ where: { userId: req.user.userId } });
                if (!mechanic) throw new BadRequestException('Perfil de mecânico não encontrado');
                const workshop = await this.prisma.user.findUnique({ where: { id: mechanic.workshopId } });
                if (!workshop?.verified) {
                    throw new ForbiddenException('A oficina associada ainda não foi verificada. Contacte o administrador para activar a conta da oficina.');
                }
                workshopId = mechanic.workshopId;
                mechanicId = mechanic.id;
            }

            const data = {
                carId: Number(body.carId),
                mileage: Number(body.mileage),
                serviceType: body.serviceType ?? undefined,
                description: body.description,
                parts: body.parts ?? undefined,
                cost: body.cost ? Number(body.cost) : undefined,
                nextServiceMileage: body.nextServiceMileage ? Number(body.nextServiceMileage) : undefined,
                mechanicId,
                workshopId,
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

    @Get('my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Listar registos da oficina autenticada' })
    async findMy(@Request() req: any) {
        return this.recordsService.findMyRecords(req.user.userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, VerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Actualizar registo (apenas dentro de 48h)' })
    async updateRecord(@Param('id') id: string, @Body() dto: UpdateRecordDto, @Request() req: any) {
        return this.recordsService.updateRecord(Number(id), req.user.userId, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, VerifiedGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar registo (apenas dentro de 48h)' })
    async deleteRecord(@Param('id') id: string, @Request() req: any) {
        return this.recordsService.deleteRecord(Number(id), req.user.userId);
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
