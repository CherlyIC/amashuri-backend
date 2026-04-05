import {
  Controller,
  Get,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import { CompareService } from './compare.service';
import { CreateCompareDto } from './dto/create-compare.dto';

@Controller('compare')
export class CompareController {
  constructor(private compareService: CompareService) {}

  // POST /compare — logged in users only
  @Post()
  compare(
    @Body() createCompareDto: CreateCompareDto,
    @Request() req: any,
  ) {
    return this.compareService.compare(req.user.id, createCompareDto);
  }

  // GET /compare/history — logged in users only
  @Get('history')
  getHistory(@Request() req: any) {
    return this.compareService.getHistory(req.user.id);
  }
}