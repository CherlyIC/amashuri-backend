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

  // POST /schools/:id/fees — admin or school admin
  @Post(':id/fees')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Param('id') schoolId: string,
    @Body() createFeeDto: CreateFeeDto,
  ) {
    createFeeDto.schoolId = schoolId;
    return this.feesService.create(createFeeDto);
  }

  // GET /schools/:id/fees — public
  @Get(':id/fees')
  @Public()
  findBySchool(@Param('id') schoolId: string) {
    return this.feesService.findBySchool(schoolId);
  }

  // PUT /fees/:id — admin or school admin
  @Put('fees/:id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() data: Partial<CreateFeeDto>,
  ) {
    return this.feesService.update(id, data);
  }

  // DELETE /fees/:id — admin only
  @Delete('fees/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}