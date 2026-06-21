import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolAdminService {
  constructor(private prisma: PrismaService) {}

  async getMySchool(userId: string) {
    const schoolAdmin = await this.prisma.schoolAdmin.findUnique({
      where: { userId },
      include: {
        school: {
          include: {
            fees: {
              orderBy: { level: 'asc' },
            },
            combinations: true,
            resources: true,
            reviews: {
              select: {
                id: true,
                teachingRating: true,
                facilitiesRating: true,
                adminRating: true,
                overallRating: true,
                comment: true,
                createdAt: true,
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!schoolAdmin) {
      throw new NotFoundException('No school assigned to this admin');
    }

    return {
      adminId: schoolAdmin.id,
      assignedAt: schoolAdmin.assignedAt,
      user: schoolAdmin.user,
      school: schoolAdmin.school,
    };
  }

  async getStats(userId: string) {
    const schoolAdmin = await this.prisma.schoolAdmin.findUnique({
      where: { userId },
      include: { school: true },
    });

    if (!schoolAdmin) {
      throw new NotFoundException('No school assigned to this admin');
    }

    const schoolId = schoolAdmin.schoolId;

    const [feesCount, combinationsCount, enquiriesCount, reviewsCount, pendingEnquiries] = await Promise.all([
      this.prisma.fee.count({ where: { schoolId } }),
      this.prisma.combination.count({ where: { schoolId } }),
      this.prisma.enquiry.count({ where: { schoolId } }),
      this.prisma.review.count({ where: { schoolId } }),
      this.prisma.enquiry.count({ where: { schoolId, status: 'SENT' } }),
    ]);

    const avgRating = await this.prisma.review.aggregate({
      where: { schoolId },
      _avg: { overallRating: true },
    });

    return {
      school: {
        id: schoolAdmin.school.id,
        name: schoolAdmin.school.name,
        status: schoolAdmin.school.status,
      },
      stats: {
        feesCount,
        combinationsCount,
        enquiriesCount,
        reviewsCount,
        pendingEnquiries,
        averageRating: avgRating._avg.overallRating || 0,
      },
    };
  }

  async getReports(userId: string, from?: Date, to?: Date) {
    const schoolAdmin = await this.prisma.schoolAdmin.findUnique({
      where: { userId },
      include: { school: true },
    });

    if (!schoolAdmin) throw new NotFoundException('No school assigned to this admin');

    const schoolId = schoolAdmin.schoolId;
    const now = new Date();

    // ── Resolve period boundaries ─────────────────────────────────────────────
    const periodStart = from ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd   = to   ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Previous period: same duration shifted back
    const durationMs = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodEnd   = new Date(periodStart.getTime() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - durationMs);

    // ── 1. Parallel counts ────────────────────────────────────────────────────
    const [
      totalReviews,
      totalEnquiries,
      sentEnquiries,
      readEnquiries,
      repliedEnquiries,
      totalFavourites,
      totalCombinations,
      totalFees,
      // Current period
      reviewsPeriod,
      enquiriesPeriod,
      // Previous period
      reviewsPrev,
      enquiriesPrev,
    ] = await Promise.all([
      this.prisma.review.count({ where: { schoolId } }),
      this.prisma.enquiry.count({ where: { schoolId } }),
      this.prisma.enquiry.count({ where: { schoolId, status: 'SENT' } }),
      this.prisma.enquiry.count({ where: { schoolId, status: 'READ' } }),
      this.prisma.enquiry.count({ where: { schoolId, status: 'REPLIED' } }),
      this.prisma.favourite.count({ where: { schoolId } }),
      this.prisma.combination.count({ where: { schoolId } }),
      this.prisma.fee.count({ where: { schoolId } }),
      // Current period
      this.prisma.review.count({ where: { schoolId, createdAt: { gte: periodStart, lte: periodEnd } } }),
      this.prisma.enquiry.count({ where: { schoolId, sentAt: { gte: periodStart, lte: periodEnd } } }),
      // Previous period
      this.prisma.review.count({ where: { schoolId, createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } }),
      this.prisma.enquiry.count({ where: { schoolId, sentAt: { gte: prevPeriodStart, lte: prevPeriodEnd } } }),
    ]);

    // ── 2. Rating aggregates (overall + per category) ─────────────────────────
    const ratingAgg = await this.prisma.review.aggregate({
      where: { schoolId },
      _avg: {
        overallRating: true,
        teachingRating: true,
        facilitiesRating: true,
        adminRating: true,
      },
    });

    const round1 = (v: number | null) =>
      v !== null ? Math.round(v * 10) / 10 : null;

    // ── 3. Review rating distribution (1–5 stars) ─────────────────────────────
    const reviewDistRaw = await this.prisma.review.groupBy({
      by: ['overallRating'],
      where: { schoolId },
      _count: { id: true },
    });
    const reviewDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviewDistRaw) {
      reviewDistribution[r.overallRating] = r._count.id;
    }

    // ── 4. Recent reviews (last 5) ────────────────────────────────────────────
    const recentReviews = await this.prisma.review.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        overallRating: true,
        teachingRating: true,
        facilitiesRating: true,
        adminRating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });

    // ── 5. Recent enquiries (last 5) ──────────────────────────────────────────
    const recentEnquiries = await this.prisma.enquiry.findMany({
      where: { schoolId },
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: {
        id: true,
        message: true,
        senderEmail: true,
        status: true,
        sentAt: true,
        repliedAt: true,
        user: { select: { id: true, name: true } },
      },
    });

    // ── 6. % change helper ────────────────────────────────────────────────────
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
      school: {
        id: schoolAdmin.school.id,
        name: schoolAdmin.school.name,
        province: schoolAdmin.school.province,
        district: schoolAdmin.school.district,
        schoolType: schoolAdmin.school.schoolType,
        status: schoolAdmin.school.status,
        isVerified: schoolAdmin.school.isVerified,
      },
      overview: {
        totalReviews,
        totalEnquiries,
        totalFavourites,
        totalCombinations,
        totalFees,
        replyRate: totalEnquiries > 0
          ? Math.round((repliedEnquiries / totalEnquiries) * 100)
          : 0,
      },
      ratings: {
        overall: round1(ratingAgg._avg.overallRating),
        teaching: round1(ratingAgg._avg.teachingRating),
        facilities: round1(ratingAgg._avg.facilitiesRating),
        administration: round1(ratingAgg._avg.adminRating),
      },
      enquiries: {
        total: totalEnquiries,
        sent: sentEnquiries,
        read: readEnquiries,
        replied: repliedEnquiries,
      },
      reviewDistribution,
      periodActivity: {
        newReviews: reviewsPeriod,
        newEnquiries: enquiriesPeriod,
        changes: {
          reviews: pct(reviewsPeriod, reviewsPrev),
          enquiries: pct(enquiriesPeriod, enquiriesPrev),
        },
      },
      recentReviews,
      recentEnquiries,
    };
  }
}
