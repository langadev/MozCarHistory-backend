import { Injectable, UnauthorizedException } from '@nestjs/common';
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
            if (role && user.role !== role) {
                return null;
            }
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        };
    }

    async register(data: any) {
        const user = await this.usersService.create(data);
        return this.login(user);
    }
}
