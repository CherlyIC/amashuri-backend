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
        <h2>New Enquiry Received on Amashuri.rw</h2>
        <p>You have received a new enquiry from a parent/student.</p>
        <hr/>
        <p><strong>From:</strong> ${senderEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr/>
        <p>You can reply directly to this email to respond to the enquiry.</p>
        <p>Thank you for being part of Amashuri.rw</p>
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

    const enquiry = await this.prisma.enquiry.create({
      data: {
        userId,
        schoolId: createEnquiryDto.schoolId,
        message: createEnquiryDto.message,
        senderEmail: createEnquiryDto.senderEmail,
        status: 'SENT',
      },
    });

    if (school.email) {
      try {
        await this.sendEmail(
          school.email,
          school.name,
          createEnquiryDto.senderEmail,
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