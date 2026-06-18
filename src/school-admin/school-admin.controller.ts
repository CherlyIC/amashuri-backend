import {
  Controller,
  Get,
  Request,
  Query,
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

  // GET /school-admins/reports?from=2026-02-01&to=2026-02-28
  @Get('reports')
  getReports(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate   = to   ? new Date(to + 'T23:59:59') : undefined;
    return this.schoolAdminService.getReports(req.user.id, fromDate, toDate);
  }
}
