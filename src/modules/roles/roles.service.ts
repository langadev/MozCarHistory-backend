import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    async create(name: string, description?: string) {
        return this.prisma.role.create({
            data: { name, description },
            include: { users: { select: { id: true, email: true, name: true } } },
        });
    }

    async findAll() {
        return this.prisma.role.findMany();
    }

    async findOne(id: number) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: { users: { select: { id: true, email: true, name: true } } },
        });
        if (!role) throw new NotFoundException(`Role ${id} não encontrado`);
        return role;
    }

    async update(id: number, name?: string, description?: string) {
        await this.findOne(id);
        return this.prisma.role.update({
            where: { id },
            data: { ...(name && { name }), ...(description !== undefined && { description }) },
            include: { users: { select: { id: true, email: true, name: true } } },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.role.delete({ where: { id } });
    }
}
