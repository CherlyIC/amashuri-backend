import { Controller, Get, Put, Delete, Param, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // GET /notifications
  @Get()
  findAll(@Request() req: any) {
    return this.notificationsService.findAll(req.user.id);
  }

  // PUT /notifications/read-all
  @Put('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  // PUT /notifications/:id/read
  @Put(':id/read')
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  // DELETE /notifications/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.remove(id, req.user.id);
  }
}
