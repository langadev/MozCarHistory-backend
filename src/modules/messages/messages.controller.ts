import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private messagesService: MessagesService) {}

    @Get('conversations')
    getConversations(@Request() req: any) {
        return this.messagesService.getConversations(req.user.userId);
    }

    @Get('conversation/:partnerId')
    getConversation(
        @Request() req: any,
        @Param('partnerId', ParseIntPipe) partnerId: number,
    ) {
        return this.messagesService.getConversation(req.user.userId, partnerId);
    }

    @Get('unread-count')
    getUnreadCount(@Request() req: any) {
        return this.messagesService.getUnreadCount(req.user.userId);
    }

    @Patch('read/:senderId')
    markRead(
        @Request() req: any,
        @Param('senderId', ParseIntPipe) senderId: number,
    ) {
        return this.messagesService.markAsRead(senderId, req.user.userId);
    }
}
