import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '@prisma/client';
import { UpdateRecordDto } from './dto/update-record.dto.js';

const EDIT_WINDOW_HOURS = 48;

@Injectable()
export class RecordsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.MaintenanceRecordUncheckedCreateInput) {
        const lastRecord = await this.prisma.maintenanceRecord.findFirst({
            where: { carId: Number(data.carId) },
            orderBy: { mileage: 'desc' },
            select: { mileage: true },
        });

        if (lastRecord && Number(data.mileage) < lastRecord.mileage) {
            throw new BadRequestException(
                `A quilometragem não pode ser inferior ao registo anterior (${lastRecord.mileage.toLocaleString('pt-PT')} km).`,
            );
        }

        return this.prisma.maintenanceRecord.create({ data });
    }

    async findByWorkshopId(workshopId: number) {
        return this.prisma.maintenanceRecord.findMany({
            where: { workshopId },
            include: {
                car: true,
                mechanic: { select: { id: true, name: true, specialty: true, photo: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByPlateNumber(plateNumber: string) {
        return this.prisma.maintenanceRecord.findMany({
            where: {
                car: {
                    plateNumber: {
                        equals: plateNumber,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                car: true,
                workshop: {
                    select: { name: true, address: true }
                },
                mechanic: { select: { id: true, name: true, specialty: true, photo: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByVin(vin: string) {
        return this.prisma.maintenanceRecord.findMany({
            where: {
                car: {
                    vin: {
                        equals: vin,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                car: true,
                workshop: {
                    select: { name: true, address: true }
                },
                mechanic: { select: { id: true, name: true, specialty: true, photo: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findMyRecords(workshopId: number) {
        return this.prisma.maintenanceRecord.findMany({
            where: { workshopId },
            include: {
                car: { select: { plateNumber: true, brand: true, model: true, photos: true } },
                mechanic: { select: { id: true, name: true, specialty: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    private assertEditable(createdAt: Date) {
        const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed > EDIT_WINDOW_HOURS) {
            throw new ForbiddenException('O prazo de 48 horas para editar este registo já expirou.');
        }
    }

    async updateRecord(id: number, workshopId: number, dto: UpdateRecordDto) {
        const record = await this.prisma.maintenanceRecord.findUnique({ where: { id } });
        if (!record) throw new NotFoundException('Registo não encontrado');
        if (record.workshopId !== workshopId) throw new ForbiddenException('Não tem permissão para editar este registo');
        this.assertEditable(record.createdAt);

        if (dto.mileage !== undefined) {
            const prevRecord = await this.prisma.maintenanceRecord.findFirst({
                where: { carId: record.carId, id: { not: id } },
                orderBy: { mileage: 'desc' },
                select: { mileage: true },
            });
            if (prevRecord && dto.mileage < prevRecord.mileage) {
                throw new BadRequestException(
                    `A quilometragem não pode ser inferior ao registo anterior (${prevRecord.mileage.toLocaleString('pt-PT')} km).`,
                );
            }
        }

        return this.prisma.maintenanceRecord.update({ where: { id }, data: dto });
    }

    async deleteRecord(id: number, workshopId: number) {
        const record = await this.prisma.maintenanceRecord.findUnique({ where: { id } });
        if (!record) throw new NotFoundException('Registo não encontrado');
        if (record.workshopId !== workshopId) throw new ForbiddenException('Não tem permissão para eliminar este registo');
        this.assertEditable(record.createdAt);
        return this.prisma.maintenanceRecord.delete({ where: { id } });
    }

    async findAllUniqueVehicles() {
        return this.prisma.car.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                records: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    include: {
                        workshop: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
    }
}
