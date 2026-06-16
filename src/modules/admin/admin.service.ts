import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import * as bcrypt from 'bcrypt';

const PAGE_SIZE = 10;

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) {}

    async getStats() {
        const [totalUsers, totalWorkshops, totalVehicles, totalRecords, pendingVehicles, recentRecords] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: { name: 'oficina' } } }),
            this.prisma.car.count(),
            this.prisma.maintenanceRecord.count(),
            this.prisma.car.count({ where: { approvalStatus: 'pendente' } }),
            this.prisma.maintenanceRecord.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    car: true,
                    workshop: { select: { name: true } },
                },
            }),
        ]);

        return { totalUsers, totalWorkshops, totalVehicles, totalRecords, pendingVehicles, recentRecords };
    }

    async getUsers(page: number, role?: string, search?: string) {
        const skip = (page - 1) * PAGE_SIZE;
        const where: any = {};

        if (role) where.role = { name: role };
        if (search?.trim()) {
            where.OR = [
                { name: { contains: search.trim(), mode: 'insensitive' } },
                { email: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }

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
                    _count: { select: { registeredCars: true, records: true } },
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

    async getVehicles(page: number, search?: string, approvalStatus?: string) {
        const skip = (page - 1) * PAGE_SIZE;
        const where: any = {};

        if (search) {
            where.OR = [
                { plateNumber: { contains: search, mode: 'insensitive' } },
                { vin: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { model: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (approvalStatus) {
            where.approvalStatus = approvalStatus;
        }

        const [vehicles, total] = await Promise.all([
            this.prisma.car.findMany({
                where,
                skip,
                take: PAGE_SIZE,
                include: {
                    registeredBy: { select: { name: true } },
                    _count: { select: { records: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.car.count({ where }),
        ]);

        return { vehicles, total, page, pageSize: PAGE_SIZE };
    }

    async approveVehicle(id: number, status: 'aprovada' | 'rejeitada', note?: string) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) throw new NotFoundException('Viatura não encontrada');

        return this.prisma.car.update({
            where: { id },
            data: { approvalStatus: status, approvalNote: note ?? null },
            select: { id: true, plateNumber: true, approvalStatus: true, approvalNote: true },
        });
    }

    async deleteVehicle(id: number) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) throw new NotFoundException('Viatura não encontrada');

        await this.prisma.maintenanceRecord.deleteMany({ where: { carId: id } });
        await this.prisma.car.delete({ where: { id } });

        return { message: 'Viatura e registos eliminados com sucesso' };
    }

    async getWorkshopDetail(id: number) {
        const workshop = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                nuit: true,
                address: true,
                verified: true,
                suspended: true,
                createdAt: true,
                registeredCars: {
                    select: {
                        id: true,
                        plateNumber: true,
                        brand: true,
                        model: true,
                        year: true,
                        color: true,
                        approvalStatus: true,
                        photos: true,
                        createdAt: true,
                        _count: { select: { records: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                records: {
                    select: {
                        id: true,
                        mileage: true,
                        serviceType: true,
                        description: true,
                        cost: true,
                        date: true,
                        car: { select: { plateNumber: true, brand: true, model: true } },
                        mechanic: { select: { name: true } },
                    },
                    orderBy: { date: 'desc' },
                    take: 100,
                },
                workshopMechanics: {
                    select: {
                        id: true,
                        name: true,
                        specialty: true,
                        phone: true,
                        photo: true,
                        active: true,
                    },
                    orderBy: { name: 'asc' },
                },
                _count: { select: { registeredCars: true, records: true, workshopMechanics: true } },
            },
        });
        if (!workshop) throw new NotFoundException('Oficina não encontrada');
        return workshop;
    }

    async createWorkshop(data: {
        name: string;
        email: string;
        phone?: string;
        nuit?: string;
        address?: string;
        password: string;
    }) {
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) throw new BadRequestException('Email já registado');

        const role = await this.prisma.role.findUnique({ where: { name: 'oficina' } });
        if (!role) throw new NotFoundException('Role "oficina" não encontrada na base de dados');

        const hashed = await bcrypt.hash(data.password, 10);

        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                phone: data.phone ?? null,
                nuit: data.nuit ?? null,
                address: data.address ?? null,
                password: hashed,
                roleId: role.id,
                verified: true,
                mustChangePassword: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                verified: true,
                role: { select: { name: true } },
            },
        });
    }

    async resetUserPassword(id: number, newPassword: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('Utilizador não encontrado');

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashed, mustChangePassword: true },
        });

        return { id, email: user.email, name: user.name };
    }
}
