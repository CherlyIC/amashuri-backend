import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../auth/public.decorator';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('ai')
  @Public()
  aiSearch(@Query('q') query: string) {
    return this.searchService.aiSearch(query);
  }
}