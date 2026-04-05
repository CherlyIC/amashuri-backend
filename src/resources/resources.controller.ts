import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { Roles, Role } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('schools')
export class ResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  // POST /schools/:id/resources — admin or school admin
  @Post(':id/resources')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Param('id') schoolId: string,
    @Body() createResourceDto: CreateResourceDto,
  ) {
    createResourceDto.schoolId = schoolId;
    return this.resourcesService.create(createResourceDto);
  }

  // GET /schools/:id/resources — public
  @Get(':id/resources')
  @Public()
  findBySchool(@Param('id') schoolId: string) {
    return this.resourcesService.findBySchool(schoolId);
  }

  // PUT /resources/:id — admin or school admin
  @Put('resources/:id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() data: Partial<CreateResourceDto>,
  ) {
    return this.resourcesService.update(id, data);
  }
}