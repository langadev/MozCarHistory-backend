import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
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

    // ── Profile ──────────────────────────────────────────────────────────────

    async getProfile(userId: number) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, phone: true, address: true, createdAt: true,
                role: { select: { name: true } },
                _count: { select: { favorites: true } },
            },
        });
    }

    async updateProfile(userId: number, data: { name?: string; phone?: string; address?: string }) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, name: true, phone: true, address: true },
        });
    }

    // ── Favorites ────────────────────────────────────────────────────────────

    async getFavorites(userId: number) {
        const favs = await this.prisma.favoriteCar.findMany({
            where: { userId },
            include: {
                car: {
                    include: {
                        records: {
                            orderBy: { date: 'desc' },
                            take: 1,
                            include: { workshop: { select: { name: true } } },
                        },
                        _count: { select: { records: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return favs.map(f => f.car);
    }

    async getFavoriteIds(userId: number): Promise<number[]> {
        const favs = await this.prisma.favoriteCar.findMany({ where: { userId }, select: { carId: true } });
        return favs.map(f => f.carId);
    }

    async addFavorite(userId: number, carId: number) {
        const car = await this.prisma.car.findUnique({ where: { id: carId } });
        if (!car) throw new NotFoundException('Viatura não encontrada');
        await this.prisma.favoriteCar.upsert({
            where: { userId_carId: { userId, carId } },
            create: { userId, carId },
            update: {},
        });
        return { ok: true };
    }

    async removeFavorite(userId: number, carId: number) {
        await this.prisma.favoriteCar.deleteMany({ where: { userId, carId } });
        return { ok: true };
    }

    // ── Search History ───────────────────────────────────────────────────────

    async getSearchHistory(userId: number) {
        return this.prisma.searchHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    async addSearchHistory(userId: number, query: string) {
        await this.prisma.searchHistory.deleteMany({ where: { userId, query } });
        await this.prisma.searchHistory.create({ data: { userId, query } });
        // Keep only last 20 entries
        const all = await this.prisma.searchHistory.findMany({
            where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true },
        });
        if (all.length > 20) {
            const toDelete = all.slice(20).map(e => e.id);
            await this.prisma.searchHistory.deleteMany({ where: { id: { in: toDelete } } });
        }
        return { ok: true };
    }

    async clearSearchHistory(userId: number) {
        await this.prisma.searchHistory.deleteMany({ where: { userId } });
        return { ok: true };
    }

    async deleteSearchHistoryItem(userId: number, id: number) {
        await this.prisma.searchHistory.deleteMany({ where: { id, userId } });
        return { ok: true };
    }
}
