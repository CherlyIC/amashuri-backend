import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { SchoolSendEnquiryDto } from './dto/school-send-enquiry.dto';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private enquiriesService: EnquiriesService) {}

  // POST /enquiries — logged in users only
  @Post()
  create(
    @Body() createEnquiryDto: CreateEnquiryDto,
    @Request() req: any,
  ) {
    return this.enquiriesService.create(req.user.id, createEnquiryDto);
  }

  // GET /enquiries — admin only
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.enquiriesService.findAll();
  }

  // GET /enquiries/my — logged in users only
  @Get('my')
  findByUser(@Request() req: any) {
    return this.enquiriesService.findByUser(req.user.id);
  }

  // GET /enquiries/school/:schoolId — school admin or admin
  @Get('school/:schoolId')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  findBySchool(@Param('schoolId') schoolId: string, @Request() req: any) {
    return this.enquiriesService.findBySchool(schoolId, req.user);
  }

  // PUT /enquiries/:id/reply — school admin or admin
  @Put(':id/reply')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  replyToEnquiry(@Param('id') id: string, @Request() req: any) {
    return this.enquiriesService.replyToEnquiry(id, req.user);
  }

  // POST /enquiries/school-send — school admin only
  @Post('school-send')
  @Roles(Role.SCHOOL_ADMIN)
  schoolSend(@Body() schoolSendDto: SchoolSendEnquiryDto, @Request() req: any) {
    return this.enquiriesService.schoolSend(
      req.user,
      schoolSendDto.recipientEmail,
      schoolSendDto.subject,
      schoolSendDto.message,
      schoolSendDto.saveToDb,
    );
  }
}