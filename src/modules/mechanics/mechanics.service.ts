import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { CreateMechanicDto } from './dto/create-mechanic.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MechanicsService {
    constructor(private prisma: PrismaService) {}

    async findAll(workshopId: number, active?: boolean) {
        const where: any = { workshopId };
        if (active !== undefined) where.active = active;
        return this.prisma.mechanic.findMany({
            where,
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(workshopId: number, dto: CreateMechanicDto, photoUrl?: string) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Este email já está registado no sistema');

        const mecRole = await this.prisma.role.findUnique({ where: { name: 'mecanico' } });
        if (!mecRole) throw new BadRequestException('Role "mecanico" não configurada. Execute o seed primeiro.');

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                password: hashedPassword,
                mustChangePassword: true,
                roleId: mecRole.id,
            },
        });

        return this.prisma.mechanic.create({
            data: {
                name: dto.name,
                specialty: dto.specialty,
                phone: dto.phone,
                photo: photoUrl,
                workshopId,
                userId: user.id,
            },
            include: { user: { select: { id: true, email: true } } },
        });
    }

    async update(id: number, workshopId: number, data: Partial<Omit<CreateMechanicDto, 'email' | 'password'>> & { photo?: string }) {
        await this.assertOwnership(id, workshopId);
        return this.prisma.mechanic.update({
            where: { id },
            data,
            include: { user: { select: { id: true, email: true } } },
        });
    }

    async updateStatus(id: number, workshopId: number, active: boolean) {
        await this.assertOwnership(id, workshopId);
        return this.prisma.mechanic.update({
            where: { id },
            data: { active },
        });
    }

    async findByUserId(userId: number) {
        const mechanic = await this.prisma.mechanic.findUnique({
            where: { userId },
            include: { workshop: { select: { id: true, name: true, email: true } } },
        });
        if (!mechanic) throw new NotFoundException('Perfil de mecânico não encontrado');
        return mechanic;
    }

    async findVehiclesByMechanic(userId: number) {
        const mechanic = await this.prisma.mechanic.findUnique({ where: { userId } });
        if (!mechanic) throw new NotFoundException('Perfil de mecânico não encontrado');

        return this.prisma.car.findMany({
            where: {
                records: { some: { workshopId: mechanic.workshopId } },
            },
            include: {
                records: {
                    where: { workshopId: mechanic.workshopId },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findMyRecords(userId: number) {
        const mechanic = await this.prisma.mechanic.findUnique({ where: { userId } });
        if (!mechanic) throw new NotFoundException('Perfil de mecânico não encontrado');

        return this.prisma.maintenanceRecord.findMany({
            where: { mechanicId: mechanic.id },
            include: { car: true, workshop: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    private async assertOwnership(id: number, workshopId: number) {
        const mechanic = await this.prisma.mechanic.findUnique({ where: { id } });
        if (!mechanic) throw new NotFoundException('Mecânico não encontrado');
        if (mechanic.workshopId !== workshopId) throw new ForbiddenException('Acesso negado');
    }
}
