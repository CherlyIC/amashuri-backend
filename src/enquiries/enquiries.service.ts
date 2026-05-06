import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { Role } from '../auth/roles.decorator';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EnquiriesService {
  constructor(private prisma: PrismaService) {}

  private async sendEmail(
    to: string,
    schoolName: string,
    senderEmail: string,
    senderName: string,
    message: string,
  ) {
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
      replyTo: senderEmail,
      subject: `New Enquiry from Amashuri.rw - ${schoolName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
          <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Amashuri.rw</h1>
            <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #1F4E79;">New Enquiry Received</h2>
            <p>Dear <strong>${schoolName}</strong>,</p>
            <p>You have received a new enquiry from a parent/student through Amashuri.rw platform.</p>
            <div style="background-color: white; padding: 20px; border-left: 4px solid #1F4E79; margin: 20px 0;">
              <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
              <p><strong>Message:</strong></p>
              <p style="color: #555;">${message}</p>
            </div>
            <p>To reply to this enquiry simply reply to this email or contact the parent directly at: <a href="mailto:${senderEmail}">${senderEmail}</a></p>
            <hr style="border: 1px solid #eee; margin: 20px 0;"/>
            <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
          </div>
        </div>
      `,
    });
  }

  async create(userId: string, createEnquiryDto: CreateEnquiryDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: createEnquiryDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const enquiry = await this.prisma.enquiry.create({
      data: {
        userId,
        schoolId: createEnquiryDto.schoolId!,
        message: createEnquiryDto.message,
        senderEmail: user.email,
        status: 'SENT',
      },
    });

    if (school.email) {
      try {
        await this.sendEmail(
          school.email,
          school.name,
          user.email,
          user.name,
          createEnquiryDto.message,
        );
      } catch (error) {
        console.error('Email sending failed:', error);
      }
    }

    return {
      message: 'Enquiry sent successfully',
      enquiry,
    };
  }

  async findByUser(userId: string) {
    const enquiries = await this.prisma.enquiry.findMany({
      where: { userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            district: true,
            email: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    return {
      data: enquiries,
      total: enquiries.length,
    };
  }

  async findBySchool(schoolId: string, user?: any) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (user && user.role === Role.SCHOOL_ADMIN) {
      const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
        where: { userId: user.id, schoolId },
      });
      if (!schoolAdmin) {
        throw new NotFoundException('School not found');
      }
    }

    const enquiries = await this.prisma.enquiry.findMany({
      where: { schoolId },
      orderBy: { sentAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      data: enquiries,
      total: enquiries.length,
    };
  }

  async replyToEnquiry(id: string, user: any) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: { school: true },
    });

    if (!enquiry) {
      throw new NotFoundException('Enquiry not found');
    }

    if (user.role === Role.SCHOOL_ADMIN) {
      const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
        where: { userId: user.id, schoolId: enquiry.schoolId },
      });
      if (!schoolAdmin) {
        throw new NotFoundException('Enquiry not found');
      }
    }

    const updated = await this.prisma.enquiry.update({
      where: { id },
      data: { status: 'REPLIED' },
    });

    return {
      message: 'Enquiry marked as replied',
      enquiry: updated,
    };
  }

  async findAll() {
    const enquiries = await this.prisma.enquiry.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        school: {
          select: { id: true, name: true, district: true },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    return {
      data: enquiries,
      total: enquiries.length,
    };
  }

  async schoolSend(user: any, recipientEmail: string, subject: string, message: string, saveToDb?: boolean) {
    // Get the school admin's school
    const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
      where: { userId: user.id },
      include: { school: true },
    });

    if (!schoolAdmin) {
      throw new NotFoundException('School admin record not found');
    }

    const school = schoolAdmin.school;

    // Send email from school to recipient
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
        from: `"${school.name}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        replyTo: school.email || process.env.SMTP_USER,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
            <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${school.name}</h1>
              <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <p>${message}</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;"/>
              <p style="color: #888; font-size: 12px;">This email was sent from ${school.name} through Amashuri.rw — Rwanda's Secondary School Directory.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('School email sending failed:', error);
      throw new Error('Failed to send email');
    }

    // Optionally save to database
    if (saveToDb) {
      await this.prisma.enquiry.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          message: `To: ${recipientEmail}\nSubject: ${subject}\n\n${message}`,
          senderEmail: school.email || process.env.SMTP_USER!,
          status: 'REPLIED',
        },
      });
    }

    return {
      message: 'Email sent successfully',
    };
  }
}
