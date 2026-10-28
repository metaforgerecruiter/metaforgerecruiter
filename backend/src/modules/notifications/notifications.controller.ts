import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /api/v1/notifications */
  @Get()
  async findAll(
    @Req() req: any,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.notificationsService.findAll(req.user, {
      unreadOnly,
      type,
      limit,
      cursor,
    });
  }

  /** PUT /api/v1/notifications/read-all */
  @Put('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsReadPut(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user);
  }

  /** POST /api/v1/notifications/read-all */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsReadPost(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user);
  }

  /** GET /api/v1/notifications/:id */
  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.findById(id, req.user);
  }

  /** PUT /api/v1/notifications/:id/read */
  @Put(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsReadPut(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user);
  }

  /** POST /api/v1/notifications/:id/read */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsReadPost(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user);
  }

  /** DELETE /api/v1/notifications/:id */
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.softDelete(id, req.user);
  }
}
