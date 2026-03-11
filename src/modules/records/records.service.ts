import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class RecordsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.MaintenanceRecordUncheckedCreateInput) {
        return this.prisma.maintenanceRecord.create({
            data,
        });
    }

    async findByWorkshopId(workshopId: number) {
        return this.prisma.maintenanceRecord.findMany({
            where: { workshopId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByPlateNumber(plateNumber: string) {
        return this.prisma.maintenanceRecord.findMany({
            where: {
                plateNumber: {
                    equals: plateNumber,
                    mode: 'insensitive'
                }
            },
            include: {
                workshop: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByVin(vin: string) {
        return this.prisma.maintenanceRecord.findMany({
            where: {
                vin: {
                    equals: vin,
                    mode: 'insensitive'
                }
            },
            include: {
                workshop: {
                    select: {
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAllUniqueVehicles() {
        return this.prisma.maintenanceRecord.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            distinct: ['plateNumber'],
            include: {
                workshop: {
                    select: {
                        name: true,
                    }
                }
            }
        });
    }
}
