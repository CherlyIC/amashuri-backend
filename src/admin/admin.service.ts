import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignAdminDto } from './dto/assign-admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

 
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
      data: { role: role as any },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

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

    return {
      message: approve
        ? 'School verified successfully'
        : 'School rejected successfully',
      school: updated,
    };
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
      data: { role: 'SCHOOL_ADMIN' },
    });

    return {
      message: 'School admin assigned successfully',
      schoolAdmin,
    };
  }
}