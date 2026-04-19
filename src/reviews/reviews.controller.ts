import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public } from '../auth/public.decorator';

@Controller('schools')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // POST /schools/:id/reviews — logged in users only
  @Post(':id/reviews')
  create(
    @Param('id') schoolId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ) {
    createReviewDto.schoolId = schoolId;
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  // GET /schools/:id/reviews — public
  @Get(':id/reviews')
  @Public()
  findBySchool(@Param('id') schoolId: string) {
    return this.reviewsService.findBySchool(schoolId);
  }

  // PUT /reviews/:id — logged in users only
  @Put('reviews/:id')
  update(
    @Param('id') id: string,
    @Body() data: Partial<CreateReviewDto>,
    @Request() req: any,
  ) {
    return this.reviewsService.update(id, req.user.id, data);
  }

  // DELETE /reviews/:id — logged in users or admin
  @Delete('reviews/:id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.reviewsService.remove(id, req.user.id, req.user.role);
  }
}