import { Controller, Post, Patch, Body, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

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

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Alterar senha do utilizador autenticado' })
    @ApiResponse({ status: 200, description: 'Senha alterada com sucesso.' })
    @ApiResponse({ status: 401, description: 'Senha atual incorreta.' })
    async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
        return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
    }
}

