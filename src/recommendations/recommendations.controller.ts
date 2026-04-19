import { Controller, Get, Param, Request } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { Public } from '../auth/public.decorator';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private recommendationsService: RecommendationsService) {}

  // GET /recommendations — logged in users only
  @Get()
  getRecommendations(@Request() req: any) {
    return this.recommendationsService.getRecommendations(req.user.id);
  }

  // GET /recommendations/schools/:id/similar — public
  @Get('schools/:id/similar')
  @Public()
  getSimilarSchools(@Param('id') id: string) {
    return this.recommendationsService.getSimilarSchools(id);
  }
}