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
}
