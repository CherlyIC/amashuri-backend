import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { FilterSchoolDto } from './dto/filter-school.dto';
import { Roles, Role } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('schools')
export class SchoolsController {
  constructor(private schoolsService: SchoolsService) {}

  // POST /schools — admin or school admin (school admin auto-assigned to created school)
  @Post()
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  create(@Body() createSchoolDto: CreateSchoolDto, @Request() req: any) {
    return this.schoolsService.create(createSchoolDto, req.user);
  }

  // GET /schools — public, with filters and pagination
  @Get()
  @Public()
  findAll(@Query() filterDto: FilterSchoolDto) {
    return this.schoolsService.findAll(filterDto);
  }

  // GET /schools/nearby — public
  @Get('nearby')
  @Public()
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number,
  ) {
    return this.schoolsService.findNearby(
      Number(lat),
      Number(lng),
      Number(radius),
    );
  }

  // GET /schools/:id — public
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  // PUT /schools/:id — admin or school admin (school admin only own school)
  @Put(':id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateSchoolDto: UpdateSchoolDto,
    @Request() req: any,
  ) {
    return this.schoolsService.update(id, updateSchoolDto, req.user.id, req.user.role);
  }

  // DELETE /schools/:id — admin only
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }

  // PUT /schools/:id/submit — admin or school admin (school admin only own school)
  @Put(':id/submit')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  submitForVerification(@Param('id') id: string, @Request() req: any) {
    return this.schoolsService.submitForVerification(id, req.user.id, req.user.role);
  }
}