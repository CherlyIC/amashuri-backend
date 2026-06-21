import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Public } from './public.decorator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class Enable2faDto {
  @IsString()
  code: string;
}

export class Disable2faDto {
  @IsString()
  password: string;
}

export class Authenticate2faDto {
  @IsString()
  tempToken: string;

  @IsString()
  code: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    return this.authService.login(
      body.email,
      body.password,
    );
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return this.authService.forgotPassword(body.email, frontendUrl);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  // 2FA endpoints
  @Post('2fa/setup')
  async setup2fa(@Req() req: any) {
    return this.authService.setup2fa(req.user.id);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enable2fa(@Req() req: any, @Body() body: Enable2faDto) {
    return this.authService.enable2fa(req.user.id, body.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disable2fa(@Req() req: any, @Body() body: Disable2faDto) {
    return this.authService.disable2fa(req.user.id, body.password);
  }

  @Public()
  @Post('2fa/authenticate')
  @HttpCode(HttpStatus.OK)
  async authenticate2fa(@Body() body: Authenticate2faDto) {
    return this.authService.authenticate2fa(body.tempToken, body.code);
  }
}
