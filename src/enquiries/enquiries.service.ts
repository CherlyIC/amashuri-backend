import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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

  // Get the user's email automatically from the database
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Save enquiry to database using user's real email
  const enquiry = await this.prisma.enquiry.create({
    data: {
      userId,
      schoolId: createEnquiryDto.schoolId!,
      message: createEnquiryDto.message,
      senderEmail: user.email, // automatically use logged in user's email
      status: 'SENT',
    },
  });

  // Send email to school if they have an email
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

  async findBySchool(schoolId: string) {
  console.log('Looking for enquiries with schoolId:', schoolId);
  
  const school = await this.prisma.school.findUnique({
    where: { id: schoolId },
  });

  console.log('School found:', school?.name);

  if (!school) {
    throw new NotFoundException('School not found');
  }

  const enquiries = await this.prisma.enquiry.findMany({
    where: { schoolId },
  });

  console.log('Enquiries found:', enquiries.length);

  return {
    data: enquiries,
    total: enquiries.length,
  };
}

  async findAll() {
    const enquiries = await this.prisma.enquiry.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            district: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
     console.log('Total enquiries found:', enquiries.length);

    return {
      data: enquiries,
      total: enquiries.length,
    };
  }
}