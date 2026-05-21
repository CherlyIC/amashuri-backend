import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

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

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
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
}