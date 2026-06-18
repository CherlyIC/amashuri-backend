import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private hashOtp(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private async sendOtpEmail(to: string, name: string, code: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Amashuri.rw" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Your Verification Code - Amashuri.rw',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
          <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Amashuri.rw</h1>
            <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #1F4E79;">Your Verification Code</h2>
            <p>Hello ${name},</p>
            <p>Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1F4E79; background: #e8edf2; padding: 12px 24px; border-radius: 4px;">${code}</span>
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;"/>
            <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
          </div>
        </div>
      `,
    });
  }

  async register(name: string, email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser({
      name,
      email,
      passwordHash,
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.totpEnabled) {
      const code = this.generateOtp();
      const hash = this.hashOtp(code);
      const expiry = new Date(Date.now() + 5 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { otpHash: hash, otpExpiry: expiry },
      });

      try {
        await this.sendOtpEmail(user.email, user.name, code);
      } catch (error) {
        console.error('OTP email sending failed:', error);
      }

      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, purpose: '2fa' },
        { expiresIn: '5m' },
      );

      return {
        requires2fa: true,
        tempToken,
      };
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgotPassword(email: string, frontendUrl: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    const token = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'password-reset' },
      { expiresIn: '1h' },
    );

    const expiry = new Date(Date.now() + 60 * 60 * 1000);
    await this.usersService.saveResetToken(user.id, token, expiry);

    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Amashuri.rw" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset Your Password - Amashuri.rw',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
            <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Amashuri.rw</h1>
              <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #1F4E79;">Reset Your Password</h2>
              <p>Hello ${user.name},</p>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #1F4E79; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
              </div>
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #555; word-break: break-all;">${resetLink}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;"/>
              <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('Password reset email failed:', error);
    }

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.purpose !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const user = await this.usersService.findByResetToken(token);
      if (!user) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await this.usersService.updatePassword(user.id, passwordHash);

      return {
        message: 'Password reset successful',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  async setup2fa(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const code = this.generateOtp();
    const hash = this.hashOtp(code);
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: { otpHash: hash, otpExpiry: expiry },
    });

    try {
      await this.sendOtpEmail(user.email, user.name, code);
    } catch (error) {
      console.error('OTP email sending failed:', error);
    }

    return { message: 'Verification code sent to your email' };
  }

  async enable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { otpHash: true, otpExpiry: true, totpEnabled: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.totpEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    if (!user.otpHash || !user.otpExpiry) {
      throw new BadRequestException('No verification code found. Call /auth/2fa/setup first.');
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      throw new BadRequestException('Verification code has expired. Call /auth/2fa/setup again.');
    }

    if (this.hashOtp(code) !== user.otpHash) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, otpHash: null, otpExpiry: null },
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2fa(userId: string, password: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, otpHash: null, otpExpiry: null },
    });

    return { message: '2FA disabled successfully' };
  }

  async authenticate2fa(tempToken: string, code: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (payload.purpose !== '2fa') {
      throw new UnauthorizedException('Invalid verification token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true,
        otpHash: true,
        otpExpiry: true,
        totpEnabled: true,
      },
    });

    if (!user || !user.totpEnabled) {
      throw new UnauthorizedException('2FA is not enabled');
    }

    if (!user.otpHash || !user.otpExpiry) {
      throw new BadRequestException('No verification code found. Please log in again.');
    }

    if (Date.now() > user.otpExpiry.getTime()) {
      throw new BadRequestException('Verification code has expired. Please log in again.');
    }

    if (this.hashOtp(code) !== user.otpHash) {
      throw new UnauthorizedException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpHash: null, otpExpiry: null },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}