import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import * as bcrypt from 'bcrypt';

interface CreateUserData {
    email: string;
    password: string;
    name?: string;
    role?: string;
    phone?: string;
    nuit?: string;
    address?: string;
    mustChangePassword?: boolean;
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { role: true },
        });
    }

    async findOneById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                nuit: true,
                address: true,
                createdAt: true,
                updatedAt: true,
                role: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: CreateUserData) {
        const existingUser = await this.findOneByEmail(data.email);
        if (existingUser) {
            throw new ConflictException('Email já registado');
        }

        const { role, ...rest } = data;
        const hashedPassword = await bcrypt.hash(rest.password, 10);

        let roleId: number | undefined;
        if (role) {
            const existingRole = await this.prisma.role.findUnique({ where: { name: role } });
            if (!existingRole) {
                throw new BadRequestException(`Role inválida: "${role}". Valores válidos: oficina, comprador, admin, mecanico`);
            }
            roleId = existingRole.id;
        }

        return this.prisma.user.create({
            data: {
                ...rest,
                password: hashedPassword,
                ...(roleId ? { roleId } : {}),
            },
            include: { role: true },
        });
    }

    async updatePassword(userId: number, hashedPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword, mustChangePassword: false },
        });
    }
}
