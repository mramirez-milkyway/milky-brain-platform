import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return {
      notifications: await this.notificationsService.findAllForUser(user.userId),
    };
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(+id, user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    return {
      count: await this.notificationsService.getUnreadCount(user.userId),
    };
  }
}
