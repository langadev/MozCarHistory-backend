import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersModule } from '../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.register({
            secret: 'SECRET_KEY', // Em produção, usar variável de ambiente
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule { }
