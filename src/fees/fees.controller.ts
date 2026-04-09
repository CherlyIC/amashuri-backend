import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeDto } from './dto/create-fee.dto';
import { Roles, Role } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';

@Controller('schools')
export class FeesController {
  constructor(private feesService: FeesService) {}

  @Post(':id/fees')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Param('id') schoolId: string,
    @Body() createFeeDto: CreateFeeDto,
  ) {
    createFeeDto.schoolId = schoolId;
    return this.feesService.create(createFeeDto);
  }

  @Get(':id/fees')
  @Public()
  findBySchool(@Param('id') schoolId: string) {
    return this.feesService.findBySchool(schoolId);
  }

  @Put('fee/:id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() data: Partial<CreateFeeDto>,
  ) {
    return this.feesService.update(id, data);
  }

  @Delete('fee/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}