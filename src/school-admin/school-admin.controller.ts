import {
  Controller,
  Get,
  Request,
} from '@nestjs/common';
import { SchoolAdminService } from './school-admin.service';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('school-admins')
@Roles(Role.SCHOOL_ADMIN, Role.ADMIN)
export class SchoolAdminController {
  constructor(private schoolAdminService: SchoolAdminService) {}

  // GET /school-admins/my-school
  @Get('my-school')
  getMySchool(@Request() req: any) {
    return this.schoolAdminService.getMySchool(req.user.id);
  }

  // GET /school-admins/stats
  @Get('stats')
  getStats(@Request() req: any) {
    return this.schoolAdminService.getStats(req.user.id);
  }
}
