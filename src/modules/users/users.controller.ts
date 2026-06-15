import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Listar todos os utilizadores (apenas admin)' })
    @ApiResponse({ status: 200, description: 'Lista de utilizadores sem passwords.' })
    @ApiResponse({ status: 401, description: 'Token inválido ou ausente.' })
    @ApiResponse({ status: 403, description: 'Acesso negado: apenas administradores.' })
    findAll() {
        return this.usersService.findAll();
    }
}
