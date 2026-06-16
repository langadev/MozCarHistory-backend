import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '@prisma/client';
import { UpdateCarDto } from './dto/update-car.dto.js';

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

    async findMyRegistered(workshopId: number) {
        return this.prisma.car.findMany({
            where: { registeredById: workshopId },
            include: { _count: { select: { records: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateCar(id: number, workshopId: number, dto: UpdateCarDto) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) throw new NotFoundException('Viatura não encontrada');
        if (car.registeredById !== workshopId) throw new ForbiddenException('Não tem permissão para editar esta viatura');
        return this.prisma.car.update({ where: { id }, data: dto });
    }

    async deleteCar(id: number, workshopId: number) {
        const car = await this.prisma.car.findUnique({
            where: { id },
            include: { _count: { select: { records: true } } },
        });
        if (!car) throw new NotFoundException('Viatura não encontrada');
        if (car.registeredById !== workshopId) throw new ForbiddenException('Não tem permissão para eliminar esta viatura');
        if (car._count.records > 0) throw new BadRequestException('Não é possível eliminar uma viatura com registos de manutenção');
        return this.prisma.car.delete({ where: { id } });
    }
}
