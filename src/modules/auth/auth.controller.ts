import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Fazer login' })
    @ApiResponse({ status: 200, description: 'Login bem-sucedido. Retorna access_token e dados do utilizador.' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password, body.role);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas ou papel de utilizador incorreto');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: 'Registar novo utilizador' })
    @ApiResponse({ status: 201, description: 'Utilizador registado. Retorna access_token e dados do utilizador.' })
    @ApiResponse({ status: 409, description: 'Email já registado.' })
    async register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }
}

