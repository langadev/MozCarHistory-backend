import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '@prisma/client';

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
