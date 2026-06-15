import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async validateUser(email: string, pass: string, role?: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (user && await bcrypt.compare(pass, user.password)) {
            if (role && user.role?.name !== role) {
                return null;
            }
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const roleName = user.role?.name ?? null;
        const mustChangePassword = user.mustChangePassword ?? false;
        const payload = { email: user.email, sub: user.id, role: roleName, mustChangePassword };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: roleName,
                mustChangePassword,
            }
        };
    }

    async register(data: any) {
        const user = await this.usersService.create(data);
        return this.login(user);
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await this.usersService.findOneById(userId);
        if (!user) throw new UnauthorizedException('Utilizador não encontrado');

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new UnauthorizedException('Senha atual incorreta');

        if (currentPassword === newPassword) {
            throw new BadRequestException('A nova senha não pode ser igual à atual');
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(userId, hashed);
        return { message: 'Senha alterada com sucesso' };
    }
}
