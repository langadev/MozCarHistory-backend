import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Fazer login' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: { type: 'string', example: 'oficina@exemplo.mz' },
                password: { type: 'string', example: 'senha123' },
                role: { type: 'string', enum: ['oficina', 'comprador'], example: 'oficina' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Login bem-sucedido. Retorna access_token e dados do utilizador.' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
    async login(@Body() body: any) {
        const user = await this.authService.validateUser(body.email, body.password, body.role);
        if (!user) {
            throw new UnauthorizedException('Credenciais inválidas ou papel de utilizador incorreto');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: 'Registar novo utilizador' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email', 'password', 'name'],
            properties: {
                email: { type: 'string', example: 'oficina@exemplo.mz' },
                password: { type: 'string', example: 'senha123' },
                name: { type: 'string', example: 'Auto Mecânica Maputo' },
                role: { type: 'string', enum: ['oficina', 'comprador'], example: 'oficina' },
                phone: { type: 'string', example: '+258 84 000 0000' },
                nuit: { type: 'string', example: '123456789' },
                address: { type: 'string', example: 'Av. Eduardo Mondlane, Maputo' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Utilizador registado. Retorna access_token e dados do utilizador.' })
    @ApiResponse({ status: 409, description: 'Email já registado.' })
    async register(@Body() body: any) {
        return this.authService.register(body);
    }
}

