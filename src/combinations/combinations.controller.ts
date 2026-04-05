import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CombinationsService } from './combinations.service';
import { CreateCombinationDto } from './dto/create-combination.dto';
import { Roles, Role } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('schools')
export class CombinationsController {
  constructor(private combinationsService: CombinationsService) {}

  // POST /schools/:id/combinations — admin or school admin
  @Post(':id/combinations')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Param('id') schoolId: string,
    @Body() createCombinationDto: CreateCombinationDto,
  ) {
    createCombinationDto.schoolId = schoolId;
    return this.combinationsService.create(createCombinationDto);
  }

  // GET /schools/:id/combinations — public
  @Get(':id/combinations')
  @Public()
  findBySchool(@Param('id') schoolId: string) {
    return this.combinationsService.findBySchool(schoolId);
  }

  // DELETE /combinations/:id — admin only
  @Delete('combinations/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.combinationsService.remove(id);
  }
}