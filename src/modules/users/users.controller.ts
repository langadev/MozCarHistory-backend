import { Controller, Get, Patch, Post, Delete, Param, Body, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    findAll() {
        return this.usersService.findAll();
    }

    // ── Profile ──────────────────────────────────────────────────────────────

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getProfile(@Request() req: any) {
        return this.usersService.getProfile(req.user.userId);
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    updateProfile(
        @Request() req: any,
        @Body() body: { name?: string; phone?: string; address?: string },
    ) {
        return this.usersService.updateProfile(req.user.userId, body);
    }

    // ── Favorites ────────────────────────────────────────────────────────────

    @Get('me/favorites')
    @UseGuards(JwtAuthGuard)
    getFavorites(@Request() req: any) {
        return this.usersService.getFavorites(req.user.userId);
    }

    @Get('me/favorites/ids')
    @UseGuards(JwtAuthGuard)
    getFavoriteIds(@Request() req: any) {
        return this.usersService.getFavoriteIds(req.user.userId);
    }

    @Post('me/favorites/:carId')
    @UseGuards(JwtAuthGuard)
    addFavorite(@Request() req: any, @Param('carId', ParseIntPipe) carId: number) {
        return this.usersService.addFavorite(req.user.userId, carId);
    }

    @Delete('me/favorites/:carId')
    @UseGuards(JwtAuthGuard)
    removeFavorite(@Request() req: any, @Param('carId', ParseIntPipe) carId: number) {
        return this.usersService.removeFavorite(req.user.userId, carId);
    }

    // ── Search History ───────────────────────────────────────────────────────

    @Get('me/search-history')
    @UseGuards(JwtAuthGuard)
    getSearchHistory(@Request() req: any) {
        return this.usersService.getSearchHistory(req.user.userId);
    }

    @Post('me/search-history')
    @UseGuards(JwtAuthGuard)
    addSearchHistory(@Request() req: any, @Body() body: { query: string }) {
        return this.usersService.addSearchHistory(req.user.userId, body.query);
    }

    @Delete('me/search-history')
    @UseGuards(JwtAuthGuard)
    clearSearchHistory(@Request() req: any) {
        return this.usersService.clearSearchHistory(req.user.userId);
    }

    @Delete('me/search-history/:id')
    @UseGuards(JwtAuthGuard)
    deleteSearchHistoryItem(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.usersService.deleteSearchHistoryItem(req.user.userId, id);
    }
}
