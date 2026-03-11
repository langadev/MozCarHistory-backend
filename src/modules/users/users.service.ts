import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findOneById(id: number) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        const existingUser = await this.findOneByEmail(data.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });
    }
}
