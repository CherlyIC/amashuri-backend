import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { Role } from '../auth/roles.decorator';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EnquiriesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

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

  async create(userId: string, createEnquiryDto: CreateEnquiryDto, file?: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Handle school enquiry (user sends to school)
    if (createEnquiryDto.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: createEnquiryDto.schoolId },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      const attachmentUrl = file ? `/uploads/enquiries/${file.filename}` : null;

      const enquiry = await this.prisma.enquiry.create({
        data: {
          userId,
          schoolId: createEnquiryDto.schoolId!,
          message: createEnquiryDto.message,
          senderEmail: user.email,
          status: 'SENT',
          attachmentUrl,
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

      // Notify the school admin in-app
      const schoolAdmin = await this.prisma.schoolAdmin.findUnique({
        where: { schoolId: school.id },
      });
      if (schoolAdmin) {
        await this.notifications.create(
          schoolAdmin.userId,
          'NEW_ENQUIRY',
          'New Enquiry Received',
          `${user.name} sent an enquiry to ${school.name}`,
          '/enquiries',
        );
      }

      return {
        message: 'Enquiry sent successfully',
        enquiry,
      };
    }

    // Handle user-to-user or school admin sends to user
    if (createEnquiryDto.recipientEmail) {
      // Get school for school admin
      const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
        where: { userId },
        include: { school: true },
      });

      if (!schoolAdmin && user.role !== Role.ADMIN) {
        throw new NotFoundException('School admin record not found');
      }

      const school = schoolAdmin?.school;
      const schoolId = school?.id || '';

      const attachmentUrl = file ? `/uploads/enquiries/${file.filename}` : null;

      // Save to database
      const enquiry = await this.prisma.enquiry.create({
        data: {
          userId,
          schoolId,
          message: `To: ${createEnquiryDto.recipientEmail}\nSubject: ${createEnquiryDto.subject || 'Enquiry'}\n\n${createEnquiryDto.message}`,
          senderEmail: school?.email || user.email,
          status: 'REPLIED',
          attachmentUrl,
        },
      });

      // Send email
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"${school?.name || 'Amashuri.rw'}" <${process.env.SMTP_USER}>`,
          to: createEnquiryDto.recipientEmail,
          replyTo: school?.email || user.email,
          subject: createEnquiryDto.subject || 'Enquiry from Amashuri.rw',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
              <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">${school?.name || 'Amashuri.rw'}</h1>
              </div>
              <div style="padding: 30px; background-color: #f9f9f9;">
                <p>${createEnquiryDto.message}</p>
                ${attachmentUrl ? `<p><a href="${process.env.BASE_URL}${attachmentUrl}">Download Attachment</a></p>` : ''}
                <hr style="border: 1px solid #eee; margin: 20px 0;"/>
                <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error('Email sending failed:', error);
      }

      return {
        message: 'Enquiry sent successfully',
        enquiry,
      };
    }

    throw new NotFoundException('Either schoolId or recipientEmail must be provided');
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

  async replyToEnquiry(id: string, replyMessage: string, user: any) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      include: { school: true, user: true },
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
      data: {
        status: 'REPLIED',
        replyMessage,
        repliedAt: new Date(),
      },
    });

    // Send email notification to the user who made the enquiry
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${enquiry.school?.name || 'Amashuri.rw'}" <${process.env.SMTP_USER}>`,
        to: enquiry.senderEmail,
        replyTo: enquiry.school?.email || user.email,
        subject: `Response from ${enquiry.school?.name || 'School'} - Amashuri.rw`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
            <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${enquiry.school?.name || 'Amashuri.rw'}</h1>
              <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
              <h2 style="color: #1F4E79;">Response to Your Enquiry</h2>
              <p>Dear <strong>${enquiry.user?.name || 'Parent/Student'}</strong>,</p>
              <p><strong>${enquiry.school?.name || 'The school'}</strong> has responded to your enquiry:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #1F4E79; margin: 20px 0;">
                <p style="color: #555;">${replyMessage}</p>
              </div>
              <p>You can view this response in your Amashuri.rw account under your enquiries.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;"/>
              <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('Reply email sending failed:', error);
    }

    // Notify the user who sent the enquiry
    await this.notifications.create(
      enquiry.userId,
      'ENQUIRY_REPLY',
      'Your Enquiry Got a Reply',
      `${enquiry.school?.name || 'A school'} replied to your enquiry`,
      '/my-enquiries',
    );

    return {
      message: 'Enquiry replied successfully',
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

  async findSentBySchool(schoolId: string, user?: any) {
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

    // Get enquiries sent by the school (where userId is a school admin of this school)
    const schoolAdmins = await this.prisma.schoolAdmin.findMany({
      where: { schoolId },
      select: { userId: true },
    });

    const adminUserIds = schoolAdmins.map((admin) => admin.userId);

    const enquiries = await this.prisma.enquiry.findMany({
      where: {
        schoolId,
        userId: { in: adminUserIds },
      },
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
}
