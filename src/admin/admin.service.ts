import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignAdminDto } from './dto/assign-admin.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private async sendRoleChangeEmail(
    to: string,
    name: string,
    newRole: string,
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const isSchoolAdmin = newRole === 'SCHOOL_ADMIN';

    await transporter.sendMail({
      from: `"Amashuri.rw" <${process.env.SMTP_USER}>`,
      to,
      subject: `Your Amashuri.rw Role Has Been Updated`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
          <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Amashuri.rw</h1>
            <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #1F4E79;">Role Update</h2>
            <p>Hello ${name},</p>
            <p>Your account role has been changed to <strong>${newRole.replace('_', ' ')}</strong>.</p>
            ${isSchoolAdmin ? `
            <p>As a School Admin, you can now:</p>
            <ul>
              <li>Log in to your account</li>
              <li>Create and manage your school profile</li>
              <li>Submit your school for verification by the super admin</li>
            </ul>
            <p>Please log out and log back in for the changes to take effect.</p>
            ` : `
            <p>Please log out and log back in for the changes to take effect.</p>
            `}
            <hr style="border: 1px solid #eee; margin: 20px 0;"/>
            <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
          </div>
        </div>
      `,
    });
  }

 
  async getStats() {
    const [
      totalSchools,
      verifiedSchools,
      pendingSchools,
      totalUsers,
      totalReviews,
      totalEnquiries,
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.count({ where: { isVerified: true } }),
      this.prisma.school.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count(),
      this.prisma.review.count(),
      this.prisma.enquiry.count(),
    ]);

    return {
      schools: {
        total: totalSchools,
        verified: verifiedSchools,
        pending: pendingSchools,
        draft: totalSchools - verifiedSchools - pendingSchools,
      },
      users: {
        total: totalUsers,
      },
      reviews: {
        total: totalReviews,
      },
      enquiries: {
        total: totalEnquiries,
      },
    };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            favourites: true,
            enquiries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: users,
      total: users.length,
    };
  }


  async changeUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: role as any,
        tokenVersion: { increment: 1 },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    try {
      await this.sendRoleChangeEmail(user.email, user.name, role);
    } catch (error) {
      console.error('Role change email failed:', error);
    }

    return {
      message: 'User role updated successfully',
      user: updated,
    };
  }
  async getPendingSchools() {
    const schools = await this.prisma.school.findMany({
      where: { status: 'PENDING' },
      include: {
        combinations: true,
        resources: true,
        fees: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: schools,
      total: schools.length,
    };
  }

  async verifySchool(schoolId: string, approve: boolean) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        status: approve ? 'VERIFIED' : 'REJECTED',
        isVerified: approve,
      },
    });

    // Notify the assigned school admin by email
    const schoolAdmin = await this.prisma.schoolAdmin.findUnique({
      where: { schoolId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (schoolAdmin) {
      try {
        await this.sendVerificationResultEmail(
          schoolAdmin.user.email,
          schoolAdmin.user.name,
          school.name,
          approve,
        );
      } catch (error) {
        console.error('School verification email failed:', error);
      }

      await this.notifications.create(
        schoolAdmin.userId,
        approve ? 'SCHOOL_VERIFIED' : 'SCHOOL_REJECTED',
        approve ? 'School Verified!' : 'School Not Approved',
        approve
          ? `${school.name} has been approved and is now listed on the platform`
          : `${school.name} was not approved. Please review your profile and resubmit`,
        '/my-school',
      );
    }

    return {
      message: approve
        ? 'School verified successfully'
        : 'School rejected successfully',
      school: updated,
    };
  }

  private async sendVerificationResultEmail(
    to: string,
    adminName: string,
    schoolName: string,
    approved: boolean,
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const subject = approved
      ? `✅ Your school "${schoolName}" has been verified!`
      : `❌ Your school "${schoolName}" was not approved`;

    const html = approved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Amashuri.rw</h1>
            <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 48px;">✅</span>
            </div>
            <h2 style="color: #1F4E79; text-align: center;">School Verified!</h2>
            <p>Dear ${adminName},</p>
            <p>Congratulations! Your school <strong>${schoolName}</strong> has been reviewed and <strong style="color: #16a34a;">approved</strong> by the Amashuri.rw team.</p>
            <p>Your school is now listed as a verified school on the platform and students across Rwanda can discover it.</p>
            <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #15803d;"><strong>What's next?</strong></p>
              <ul style="color: #15803d; margin: 10px 0 0 0;">
                <li>Keep your school profile up to date</li>
                <li>Respond promptly to student enquiries</li>
                <li>Add fees, subject combinations, and facilities if not done yet</li>
              </ul>
            </div>
            <p>Thank you for being part of Amashuri.rw!</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1F4E79; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Amashuri.rw</h1>
            <p style="color: #D6E4F0; margin: 5px 0;">Rwanda's Secondary School Directory</p>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 48px;">❌</span>
            </div>
            <h2 style="color: #1F4E79; text-align: center;">School Not Approved</h2>
            <p>Dear ${adminName},</p>
            <p>Thank you for submitting <strong>${schoolName}</strong> for verification on Amashuri.rw.</p>
            <p>After review, your school was <strong style="color: #dc2626;">not approved</strong> at this time.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #b91c1c;"><strong>What you can do:</strong></p>
              <ul style="color: #b91c1c; margin: 10px 0 0 0;">
                <li>Review and complete all school profile details</li>
                <li>Make sure fees, combinations, and resources are filled in</li>
                <li>Resubmit your school for verification once updated</li>
              </ul>
            </div>
            <p>If you have any questions, please contact our support team.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #888; font-size: 12px;">This email was sent through Amashuri.rw — Rwanda's Secondary School Directory.</p>
          </div>
        </div>
      `;

    await transporter.sendMail({
      from: `"Amashuri.rw" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  }

  async assignSchoolAdmin(assignAdminDto: AssignAdminDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: assignAdminDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: assignAdminDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const existing = await this.prisma.schoolAdmin.findUnique({
      where: { schoolId: assignAdminDto.schoolId },
    });

    if (existing) {
      throw new ConflictException('School already has an admin assigned');
    }

    const schoolAdmin = await this.prisma.schoolAdmin.create({
      data: {
        userId: assignAdminDto.userId,
        schoolId: assignAdminDto.schoolId,
      },
    });

    await this.prisma.user.update({
      where: { id: assignAdminDto.userId },
      data: {
        role: 'SCHOOL_ADMIN',
        tokenVersion: { increment: 1 },
      },
    });

    try {
      await this.sendRoleChangeEmail(user.email, user.name, 'SCHOOL_ADMIN');
    } catch (error) {
      console.error('Role change email failed:', error);
    }

    return {
      message: 'School admin assigned successfully',
      schoolAdmin,
    };
  }

  async getAllReviews() {
    const reviews = await this.prisma.review.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        school: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: reviews,
      total: reviews.length,
    };
  }

  async getReports(from?: Date, to?: Date) {
    const now = new Date();

    // ── Resolve period boundaries ─────────────────────────────────────────────
    const periodStart = from ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd   = to   ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Previous period: same duration shifted back
    const durationMs = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodEnd   = new Date(periodStart.getTime() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - durationMs);

    // ── 1. Parallel overview counts ───────────────────────────────────────────
    const [
      totalSchools,
      verifiedSchools,
      pendingSchools,
      rejectedSchools,
      totalUsers,
      regularUsers,
      schoolAdminUsers,
      superAdminUsers,
      totalReviews,
      totalEnquiries,
      repliedEnquiries,
      totalFavourites,
      totalComparisons,
      totalChatSessions,
      // Current period activity
      newUsersPeriod,
      newSchoolsPeriod,
      newReviewsPeriod,
      newEnquiriesPeriod,
      // Previous period activity (for % change)
      newUsersPrev,
      newSchoolsPrev,
      newReviewsPrev,
      newEnquiriesPrev,
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.count({ where: { isVerified: true } }),
      this.prisma.school.count({ where: { status: 'PENDING' } }),
      this.prisma.school.count({ where: { status: 'REJECTED' } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.user.count({ where: { role: 'SCHOOL_ADMIN' } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.review.count(),
      this.prisma.enquiry.count(),
      this.prisma.enquiry.count({ where: { status: 'REPLIED' } }),
      this.prisma.favourite.count(),
      this.prisma.comparison.count(),
      this.prisma.chatSession.count(),
      // Current period
      this.prisma.user.count({ where: { createdAt: { gte: periodStart, lte: periodEnd } } }),
      this.prisma.school.count({ where: { createdAt: { gte: periodStart, lte: periodEnd } } }),
      this.prisma.review.count({ where: { createdAt: { gte: periodStart, lte: periodEnd } } }),
      this.prisma.enquiry.count({ where: { sentAt: { gte: periodStart, lte: periodEnd } } }),
      // Previous period
      this.prisma.user.count({ where: { createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } }),
      this.prisma.school.count({ where: { createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } }),
      this.prisma.review.count({ where: { createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } }),
      this.prisma.enquiry.count({ where: { sentAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } }),
    ]);

    // ── 2. Average platform rating ─────────────────────────────────────────────
    const ratingAggregate = await this.prisma.review.aggregate({
      _avg: { overallRating: true },
    });
    const averagePlatformRating =
      ratingAggregate._avg.overallRating !== null
        ? Math.round((ratingAggregate._avg.overallRating ?? 0) * 10) / 10
        : null;

    // ── 3. Schools breakdown by province (in memory) ──────────────────────────
    const allSchoolsRaw = await this.prisma.school.findMany({
      select: { province: true, status: true, schoolType: true, isVerified: true },
    });

    const provinceSummary: Record<string, { total: number; verified: number; pending: number; rejected: number }> = {};
    const typeSummary: Record<string, number> = { PUBLIC: 0, PRIVATE: 0, GOVERNMENT_AIDED: 0 };

    for (const s of allSchoolsRaw) {
      if (!provinceSummary[s.province]) {
        provinceSummary[s.province] = { total: 0, verified: 0, pending: 0, rejected: 0 };
      }
      provinceSummary[s.province].total++;
      if (s.status === 'VERIFIED') provinceSummary[s.province].verified++;
      if (s.status === 'PENDING')  provinceSummary[s.province].pending++;
      if (s.status === 'REJECTED') provinceSummary[s.province].rejected++;
      typeSummary[s.schoolType] = (typeSummary[s.schoolType] ?? 0) + 1;
    }

    const schoolsByProvince = Object.entries(provinceSummary).map(([province, counts]) => ({
      province,
      ...counts,
    }));

    const schoolsByType = Object.entries(typeSummary).map(([type, count]) => ({
      type,
      count,
    }));

    // ── 4. Top-rated schools ──────────────────────────────────────────────────
    const topRatingsRaw = await this.prisma.review.groupBy({
      by: ['schoolId'],
      _avg: { overallRating: true },
      _count: { id: true },
      orderBy: { _avg: { overallRating: 'desc' } },
      take: 10,
    });

    const topSchoolIds = topRatingsRaw.map((r) => r.schoolId);
    const topSchoolDetails = await this.prisma.school.findMany({
      where: { id: { in: topSchoolIds } },
      select: { id: true, name: true, province: true, district: true, schoolType: true },
    });
    const topSchoolMap = Object.fromEntries(topSchoolDetails.map((s) => [s.id, s]));

    const topRatedSchools = topRatingsRaw.map((r) => ({
      ...(topSchoolMap[r.schoolId] ?? { id: r.schoolId, name: 'Unknown', province: '', district: '', schoolType: '' }),
      avgRating: Math.round((r._avg.overallRating ?? 0) * 10) / 10,
      reviewCount: r._count.id,
    }));

    // ── 5. Most enquired schools ──────────────────────────────────────────────
    const enquiryGroups = await this.prisma.enquiry.groupBy({
      by: ['schoolId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const enquirySchoolIds = enquiryGroups.map((e) => e.schoolId);
    const enquirySchoolDetails = await this.prisma.school.findMany({
      where: { id: { in: enquirySchoolIds } },
      select: { id: true, name: true, province: true, district: true },
    });
    const enquirySchoolMap = Object.fromEntries(enquirySchoolDetails.map((s) => [s.id, s]));

    const mostEnquiredSchools = enquiryGroups.map((e) => ({
      ...(enquirySchoolMap[e.schoolId] ?? { id: e.schoolId, name: 'Unknown', province: '', district: '' }),
      enquiryCount: e._count.id,
    }));

    // ── 6. Review rating distribution (1–5 stars) ─────────────────────────────
    const reviewDistRaw = await this.prisma.review.groupBy({
      by: ['overallRating'],
      _count: { id: true },
    });
    const reviewDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviewDistRaw) {
      reviewDistribution[r.overallRating] = r._count.id;
    }

    // ── 7. % change helper ────────────────────────────────────────────────────
    const pct = (current: number, previous: number) =>
      previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

    return {
      generatedAt: now.toISOString(),
      period: {
        from: periodStart.toISOString().split('T')[0],
        to: periodEnd.toISOString().split('T')[0],
        previousFrom: prevPeriodStart.toISOString().split('T')[0],
        previousTo: prevPeriodEnd.toISOString().split('T')[0],
      },
      overview: {
        schools: {
          total: totalSchools,
          verified: verifiedSchools,
          pending: pendingSchools,
          rejected: rejectedSchools,
          draft: totalSchools - verifiedSchools - pendingSchools - rejectedSchools,
        },
        users: {
          total: totalUsers,
          regular: regularUsers,
          schoolAdmins: schoolAdminUsers,
          superAdmins: superAdminUsers,
        },
        reviews: {
          total: totalReviews,
          averagePlatformRating,
        },
        enquiries: {
          total: totalEnquiries,
          replied: repliedEnquiries,
          replyRate: totalEnquiries > 0 ? Math.round((repliedEnquiries / totalEnquiries) * 100) : 0,
        },
        engagement: {
          totalFavourites,
          totalComparisons,
          totalChatSessions,
        },
      },
      periodActivity: {
        newUsers: newUsersPeriod,
        newSchools: newSchoolsPeriod,
        newReviews: newReviewsPeriod,
        newEnquiries: newEnquiriesPeriod,
        changes: {
          users: pct(newUsersPeriod, newUsersPrev),
          schools: pct(newSchoolsPeriod, newSchoolsPrev),
          reviews: pct(newReviewsPeriod, newReviewsPrev),
          enquiries: pct(newEnquiriesPeriod, newEnquiriesPrev),
        },
      },
      schoolsByProvince,
      schoolsByType,
      topRatedSchools,
      mostEnquiredSchools,
      reviewDistribution,
    };
  }
}