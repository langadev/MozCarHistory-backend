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

    async search(q: string) {
        const term = q.trim();
        const cars = await this.prisma.car.findMany({
            where: {
                OR: [
                    { plateNumber: { contains: term, mode: 'insensitive' } },
                    { vin: { contains: term, mode: 'insensitive' } },
                    { brand: { contains: term, mode: 'insensitive' } },
                    { model: { contains: term, mode: 'insensitive' } },
                    { color: { contains: term, mode: 'insensitive' } },
                ],
            },
            include: {
                records: {
                    orderBy: { mileage: 'desc' },
                    include: {
                        workshop: { select: { name: true } },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 30,
        });

        // shape the response: trim to last record, add count
        return cars.map(({ records, ...car }) => ({
            ...car,
            records: records.slice(0, 1).map(r => ({
                mileage: r.mileage,
                date: r.date,
                serviceType: r.serviceType,
                workshop: r.workshop,
            })),
            _count: { records: records.length },
        }));
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
