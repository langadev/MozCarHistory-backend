import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Criar um novo role (apenas admin)' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name'],
            properties: {
                name: { type: 'string', example: 'oficina' },
                description: { type: 'string', example: 'Oficina autorizada a registar serviços' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'Role criado com sucesso.' })
    create(@Body() body: { name: string; description?: string }) {
        return this.rolesService.create(body.name, body.description);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os roles' })
    @ApiResponse({ status: 200, description: 'Lista de roles com o utilizador associado.' })
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter role por ID' })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiResponse({ status: 200, description: 'Role encontrado.' })
    @ApiResponse({ status: 404, description: 'Role não encontrado.' })
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(Number(id));
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Actualizar role (apenas admin)' })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'comprador' },
                description: { type: 'string', example: 'Utilizador que consulta histórico' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Role actualizado.' })
    update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
        return this.rolesService.update(Number(id), body.name, body.description);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @ApiOperation({ summary: 'Eliminar role (apenas admin)' })
    @ApiParam({ name: 'id', type: 'number', example: 1 })
    @ApiResponse({ status: 200, description: 'Role eliminado.' })
    @ApiResponse({ status: 404, description: 'Role não encontrado.' })
    remove(@Param('id') id: string) {
        return this.rolesService.remove(Number(id));
    }
}
