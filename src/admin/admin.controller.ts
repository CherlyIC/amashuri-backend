import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AssignAdminDto } from './dto/assign-admin.dto';
import { Roles, Role } from '../auth/roles.decorator';
import { IsString } from 'class-validator';

export class ChangeRoleDto {
  @IsString()
  role: string;
}

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // GET /admin/stats
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // GET /admin/users
  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // PUT /admin/users/:id/role
  @Put('users/:id/role')
  changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(id, changeRoleDto.role);
  }

  // GET /admin/schools/pending
  @Get('schools/pending')
  getPendingSchools() {
    return this.adminService.getPendingSchools();
  }

  // PUT /admin/schools/:id/verify
  @Put('schools/:id/verify')
  verifySchool(
    @Param('id') id: string,
    @Query('approve') approve: string,
  ) {
    return this.adminService.verifySchool(id, approve === 'true');
  }

  // POST /admin/schools/assign-admin
  @Post('schools/assign-admin')
  assignSchoolAdmin(@Body() assignAdminDto: AssignAdminDto) {
    return this.adminService.assignSchoolAdmin(assignAdminDto);
  }
}