import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CarsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.CarUncheckedCreateInput) {
        return this.prisma.car.create({
            data,
        });
    }

    async findAll() {
        return this.prisma.car.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findById(id: number) {
        return this.prisma.car.findUnique({
            where: { id },
            include: {
                records: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        workshop: {
                            select: { name: true, address: true }
                        }
                    }
                }
            }
        });
    }

    async findByVin(vin: string) {
        return this.prisma.car.findUnique({
            where: { vin },
        });
    }

    async findByPlateNumber(plateNumber: string) {
        return this.prisma.car.findUnique({
            where: { plateNumber },
        });
    }
}
