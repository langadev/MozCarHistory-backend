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
            orderBy: { createdAt: 'desc' },
            include: {
                records: {
                    orderBy: { mileage: 'desc' },
                    take: 1,
                    select: { mileage: true },
                },
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

    async search(q: string, page = 1, limit = 12) {
        const term = q.trim();
        const skip = (page - 1) * limit;

        const where = {
            approvalStatus: 'aprovada',
            OR: [
                { plateNumber: { contains: term, mode: 'insensitive' as const } },
                { vin: { contains: term, mode: 'insensitive' as const } },
                { brand: { contains: term, mode: 'insensitive' as const } },
                { model: { contains: term, mode: 'insensitive' as const } },
                { color: { contains: term, mode: 'insensitive' as const } },
            ],
        };

        const [carsRaw, total] = await Promise.all([
            this.prisma.car.findMany({
                where,
                include: {
                    records: {
                        orderBy: { mileage: 'desc' },
                        include: { workshop: { select: { name: true } } },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.car.count({ where }),
        ]);

        const cars = carsRaw.map(({ records, ...car }) => ({
            ...car,
            records: records.slice(0, 1).map(r => ({
                mileage: r.mileage,
                date: r.date,
                serviceType: r.serviceType,
                workshop: r.workshop,
            })),
            _count: { records: records.length },
        }));

        return { cars, total, page, pageSize: limit };
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
