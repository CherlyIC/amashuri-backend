import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET /users/me — logged in users only
  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  // PUT /users/me — logged in users only
  @Put('me')
  updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  // DELETE /users/me — logged in users only
  @Delete('me')
  deleteAccount(@Request() req: any) {
    return this.usersService.deleteAccount(req.user.id);
  }
}