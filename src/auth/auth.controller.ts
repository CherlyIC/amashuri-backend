import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

export class RegisterDto {
  name: string;
  email: string;
  password: string;
}

export class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
    );
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }
}