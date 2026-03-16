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
            include: { car: true },
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
