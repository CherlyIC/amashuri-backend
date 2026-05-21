import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { ReplyToEnquiryDto } from './dto/reply-to-enquiry.dto';
import { Roles, Role } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('enquiries')
export class EnquiriesController {
  constructor(private enquiriesService: EnquiriesService) {}

  // POST /enquiries — unified endpoint for all users
  @Post()
  @UseInterceptors(FileInterceptor('attachment', {
    storage: diskStorage({
      destination: './uploads/enquiries',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
        return cb(new Error('Only image and document files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  }))
  create(
    @Body() createEnquiryDto: CreateEnquiryDto,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.enquiriesService.create(req.user.id, createEnquiryDto, file);
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

  // GET /enquiries/school/:schoolId/sent — school admin or admin
  @Get('school/:schoolId/sent')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  findSentBySchool(@Param('schoolId') schoolId: string, @Request() req: any) {
    return this.enquiriesService.findSentBySchool(schoolId, req.user);
  }

  // PUT /enquiries/:id/reply — school admin or admin
  @Put(':id/reply')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  replyToEnquiry(
    @Param('id') id: string,
    @Body() replyDto: ReplyToEnquiryDto,
    @Request() req: any,
  ) {
    return this.enquiriesService.replyToEnquiry(id, replyDto.message, req.user);
  }
}