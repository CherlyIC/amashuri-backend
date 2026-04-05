import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Request,
} from '@nestjs/common';
import { FavouritesService } from './favourites.service';

@Controller('users')
export class FavouritesController {
  constructor(private favouritesService: FavouritesService) {}

  // GET /users/favourites — logged in users only
  @Get('favourites')
  findByUser(@Request() req: any) {
    return this.favouritesService.findByUser(req.user.id);
  }

  // POST /users/favourites/:schoolId — logged in users only
  @Post('favourites/:schoolId')
  create(
    @Param('schoolId') schoolId: string,
    @Request() req: any,
  ) {
    return this.favouritesService.create(req.user.id, schoolId);
  }

  // DELETE /users/favourites/:schoolId — logged in users only
  @Delete('favourites/:schoolId')
  remove(
    @Param('schoolId') schoolId: string,
    @Request() req: any,
  ) {
    return this.favouritesService.remove(req.user.id, schoolId);
  }
}