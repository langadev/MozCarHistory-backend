import {
    Controller, Get, Post, Patch, Delete,
    Param, Query, Body, UseGuards, Request, ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
    constructor(private adminService: AdminService) {}

    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }

    @Get('users')
    getUsers(
        @Query('page') page = '1',
        @Query('role') role?: string,
        @Query('search') search?: string,
    ) {
        return this.adminService.getUsers(Number(page), role, search);
    }

    @Patch('users/:id/role')
    updateUserRole(
        @Param('id', ParseIntPipe) id: number,
        @Body('role') role: string,
        @Request() req: any,
    ) {
        return this.adminService.updateUserRole(id, role, req.user.userId);
    }

    @Patch('users/:id/status')
    updateUserStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('suspended') suspended: boolean,
    ) {
        return this.adminService.updateUserStatus(id, suspended);
    }

    @Get('workshops')
    getWorkshops(
        @Query('page') page = '1',
        @Query('verified') verified?: string,
    ) {
        const verifiedBool = verified === undefined ? undefined : verified === 'true';
        return this.adminService.getWorkshops(Number(page), verifiedBool);
    }

    @Get('workshops/:id')
    getWorkshopDetail(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.getWorkshopDetail(id);
    }

    @Patch('workshops/:id/verify')
    updateWorkshopVerify(
        @Param('id', ParseIntPipe) id: number,
        @Body('verified') verified: boolean,
    ) {
        return this.adminService.updateWorkshopVerify(id, verified);
    }

    @Patch('workshops/:id/status')
    updateWorkshopStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('suspended') suspended: boolean,
    ) {
        return this.adminService.updateWorkshopStatus(id, suspended);
    }

    @Get('vehicles')
    getVehicles(
        @Query('page') page = '1',
        @Query('search') search?: string,
        @Query('approvalStatus') approvalStatus?: string,
    ) {
        return this.adminService.getVehicles(Number(page), search, approvalStatus);
    }

    @Delete('vehicles/:id')
    deleteVehicle(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteVehicle(id);
    }

    @Patch('vehicles/:id/approval')
    approveVehicle(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: 'aprovada' | 'rejeitada',
        @Body('note') note?: string,
    ) {
        return this.adminService.approveVehicle(id, status, note);
    }

    @Post('workshops')
    createWorkshop(@Body() body: {
        name: string;
        email: string;
        phone?: string;
        nuit?: string;
        address?: string;
        password: string;
    }) {
        return this.adminService.createWorkshop(body);
    }

    @Patch('users/:id/reset-password')
    resetUserPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body('password') password: string,
        @Request() req: any,
    ) {
        if (id === req.user.userId) {
            throw new Error('Use a página de alteração de senha para mudar a sua própria senha');
        }
        return this.adminService.resetUserPassword(id, password);
    }
}
