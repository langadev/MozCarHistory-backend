import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import * as bcrypt from 'bcrypt';

const PAGE_SIZE = 10;

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    async getStats() {
        const [totalUsers, totalWorkshops, totalVehicles, totalRecords, recentRecords] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: { name: 'oficina' } } }),
            this.prisma.car.count(),
            this.prisma.maintenanceRecord.count(),
            this.prisma.maintenanceRecord.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    car: true,
                    workshop: { select: { name: true } },
                },
            }),
        ]);

        return { totalUsers, totalWorkshops, totalVehicles, totalRecords, recentRecords };
    }

    async getUsers(page: number, role?: string) {
        const skip = (page - 1) * PAGE_SIZE;
        const where = role ? { role: { name: role } } : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: PAGE_SIZE,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                    suspended: true,
                    role: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total, page, pageSize: PAGE_SIZE };
    }

    async updateUserRole(id: number, roleName: string, requesterId: number) {
        if (id === requesterId) {
            throw new BadRequestException('Não pode alterar o role da sua própria conta');
        }

        const role = await this.prisma.role.findUnique({ where: { name: roleName } });
        if (!role) throw new NotFoundException(`Role "${roleName}" não encontrada`);

        return this.prisma.user.update({
            where: { id },
            data: { roleId: role.id },
            select: { id: true, email: true, name: true, role: { select: { name: true } } },
        });
    }

    async updateUserStatus(id: number, suspended: boolean) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilizador não encontrado');

        return this.prisma.user.update({
            where: { id },
            data: { suspended },
            select: { id: true, email: true, name: true, suspended: true },
        });
    }

    async getWorkshops(page: number, verified?: boolean) {
        const skip = (page - 1) * PAGE_SIZE;
        const where: any = { role: { name: 'oficina' } };
        if (verified !== undefined) where.verified = verified;

        const [workshops, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: PAGE_SIZE,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    verified: true,
                    suspended: true,
                    createdAt: true,
                    _count: { select: { cars: true, records: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { workshops, total, page, pageSize: PAGE_SIZE };
    }

    async updateWorkshopVerify(id: number, verified: boolean) {
        const workshop = await this.prisma.user.findUnique({ where: { id } });
        if (!workshop) throw new NotFoundException('Oficina não encontrada');

        return this.prisma.user.update({
            where: { id },
            data: { verified },
            select: { id: true, email: true, name: true, verified: true },
        });
    }

    async updateWorkshopStatus(id: number, suspended: boolean) {
        return this.updateUserStatus(id, suspended);
    }

    async getVehicles(page: number, search?: string) {
        const skip = (page - 1) * PAGE_SIZE;
        const where = search
            ? {
                  OR: [
                      { plateNumber: { contains: search, mode: 'insensitive' as const } },
                      { vin: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [vehicles, total] = await Promise.all([
            this.prisma.car.findMany({
                where,
                skip,
                take: PAGE_SIZE,
                include: {
                    owner: { select: { name: true } },
                    _count: { select: { records: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.car.count({ where }),
        ]);

        return { vehicles, total, page, pageSize: PAGE_SIZE };
    }

    async deleteVehicle(id: number) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) throw new NotFoundException('Viatura não encontrada');

        await this.prisma.maintenanceRecord.deleteMany({ where: { carId: id } });
        await this.prisma.car.delete({ where: { id } });

        return { message: 'Viatura e registos eliminados com sucesso' };
    }
}
