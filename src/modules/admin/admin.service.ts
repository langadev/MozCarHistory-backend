import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import * as bcrypt from 'bcrypt';

const PAGE_SIZE = 10;

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) {}

    async getStats() {
        const [totalUsers, totalWorkshops, totalVehicles, totalRecords, pendingVehicles, recentRecords] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: { name: 'oficina' } } }),
            this.prisma.car.count(),
            this.prisma.maintenanceRecord.count(),
            this.prisma.car.count({ where: { approvalStatus: 'pendente' } }),
            this.prisma.maintenanceRecord.findMany({
                take: 30,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    date: true,
                    createdAt: true,
                    mileage: true,
                    serviceType: true,
                    description: true,
                    cost: true,
                    car: { select: { plateNumber: true, brand: true, model: true, photos: true } },
                    workshop: { select: { id: true, name: true } },
                    mechanic: { select: { name: true, specialty: true } },
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

        const updated = await this.prisma.user.update({
            where: { id },
            data: { suspended },
            select: { id: true, email: true, name: true, suspended: true },
        });

        if (!suspended) {
            await this.notificationsService.create(
                id,
                'account_activated',
                'Conta Reactivada',
                'A sua conta foi reactivada pelo administrador.',
            );
        }

        return updated;
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

        const updated = await this.prisma.user.update({
            where: { id },
            data: { verified },
            select: { id: true, email: true, name: true, verified: true },
        });

        await this.notificationsService.create(
            id,
            verified ? 'workshop_verified' : 'workshop_unverified',
            verified ? 'Conta Verificada' : 'Verificação Removida',
            verified
                ? 'A sua oficina foi verificada. Já pode registar viaturas e serviços.'
                : 'A verificação da sua oficina foi removida pelo administrador.',
            '/perfil-oficina',
        );

        return updated;
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
        const car = await this.prisma.car.findUnique({ where: { id }, select: { id: true, plateNumber: true, registeredById: true } });
        if (!car) throw new NotFoundException('Viatura não encontrada');

        const updated = await this.prisma.car.update({
            where: { id },
            data: { approvalStatus: status, approvalNote: note ?? null },
            select: { id: true, plateNumber: true, approvalStatus: true, approvalNote: true },
        });

        if (car.registeredById) {
            const isApproved = status === 'aprovada';
            await this.notificationsService.create(
                car.registeredById,
                isApproved ? 'vehicle_approved' : 'vehicle_rejected',
                isApproved ? 'Viatura Aprovada' : 'Viatura Rejeitada',
                isApproved
                    ? `A viatura ${car.plateNumber} foi aprovada e já está disponível no catálogo.`
                    : `A viatura ${car.plateNumber} foi rejeitada.${note ? ` Motivo: ${note}` : ''}`,
                '/minhas-viaturas',
            );
        }

        return updated;
    }

    async deleteVehicle(id: number) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) throw new NotFoundException('Viatura não encontrada');

        await this.prisma.maintenanceRecord.deleteMany({ where: { carId: id } });
        await this.prisma.car.delete({ where: { id } });

        return { message: 'Viatura e registos eliminados com sucesso' };
    }

    async getFinanceStats() {
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOf6MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const [totalAgg, thisMonthAgg, lastMonthAgg, recentRecords, topWorkshopGroups, serviceTypeGroups] = await Promise.all([
            this.prisma.maintenanceRecord.aggregate({
                where: { cost: { not: null } },
                _sum: { cost: true },
                _count: { id: true },
                _avg: { cost: true },
            }),
            this.prisma.maintenanceRecord.aggregate({
                where: { date: { gte: startOfThisMonth }, cost: { not: null } },
                _sum: { cost: true },
                _count: { id: true },
            }),
            this.prisma.maintenanceRecord.aggregate({
                where: { date: { gte: startOfLastMonth, lt: startOfThisMonth }, cost: { not: null } },
                _sum: { cost: true },
                _count: { id: true },
            }),
            this.prisma.maintenanceRecord.findMany({
                where: { date: { gte: startOf6MonthsAgo }, cost: { not: null } },
                select: { date: true, cost: true },
            }),
            this.prisma.maintenanceRecord.groupBy({
                by: ['workshopId'],
                where: { cost: { not: null } },
                _sum: { cost: true },
                _count: { _all: true },
                orderBy: { _sum: { cost: 'desc' } },
                take: 5,
            }),
            this.prisma.maintenanceRecord.groupBy({
                by: ['serviceType'],
                where: { cost: { not: null } },
                _sum: { cost: true },
                _count: { _all: true },
                orderBy: { _sum: { cost: 'desc' } },
                take: 6,
            }),
        ]);

        // Build monthly chart data (last 6 months, filling gaps with 0)
        const monthlyMap: Record<string, { revenue: number; count: number }> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyMap[key] = { revenue: 0, count: 0 };
        }
        for (const r of recentRecords) {
            const d = new Date(r.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyMap[key]) {
                monthlyMap[key].revenue += r.cost ?? 0;
                monthlyMap[key].count += 1;
            }
        }
        const monthlyRevenue = Object.entries(monthlyMap).map(([month, data]) => ({ month, ...data }));

        // Fetch workshop names
        const workshopIds = topWorkshopGroups.map(w => w.workshopId);
        const workshopUsers = await this.prisma.user.findMany({
            where: { id: { in: workshopIds } },
            select: { id: true, name: true, email: true },
        });
        const workshopMap = Object.fromEntries(workshopUsers.map(w => [w.id, w]));
        const topWorkshops = topWorkshopGroups.map(w => ({
            id: w.workshopId,
            name: workshopMap[w.workshopId]?.name ?? workshopMap[w.workshopId]?.email ?? '—',
            revenue: w._sum.cost ?? 0,
            records: w._count._all,
        }));

        const revenueByServiceType = serviceTypeGroups.map(s => ({
            serviceType: s.serviceType ?? 'Outros',
            revenue: s._sum.cost ?? 0,
            count: s._count._all,
        }));

        return {
            totalRevenue: totalAgg._sum.cost ?? 0,
            totalRecordsWithCost: totalAgg._count.id,
            avgCost: Math.round(totalAgg._avg.cost ?? 0),
            thisMonthRevenue: thisMonthAgg._sum.cost ?? 0,
            thisMonthCount: thisMonthAgg._count.id,
            lastMonthRevenue: lastMonthAgg._sum.cost ?? 0,
            lastMonthCount: lastMonthAgg._count.id,
            monthlyRevenue,
            topWorkshops,
            revenueByServiceType,
        };
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
