import { Controller, Get, Patch, Delete, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) {}

    @Get()
    findAll(@Request() req: any) {
        return this.notificationsService.findAll(req.user.userId);
    }

    @Get('unread-count')
    countUnread(@Request() req: any) {
        return this.notificationsService.countUnread(req.user.userId);
    }

    @Patch('read-all')
    markAllRead(@Request() req: any) {
        return this.notificationsService.markAllRead(req.user.userId);
    }

    @Patch(':id/read')
    markRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        return this.notificationsService.markRead(id, req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        return this.notificationsService.remove(id, req.user.userId);
    }
}
