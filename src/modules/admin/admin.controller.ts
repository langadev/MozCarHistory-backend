import {
    Controller, Get, Patch, Delete,
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
    ) {
        return this.adminService.getUsers(Number(page), role);
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
    ) {
        return this.adminService.getVehicles(Number(page), search);
    }

    @Delete('vehicles/:id')
    deleteVehicle(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteVehicle(id);
    }
}
