import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { FilterSchoolDto } from './dto/filter-school.dto';
import { Role } from '../auth/roles.decorator';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async create(createSchoolDto: CreateSchoolDto, user?: any) {
    // If user is SCHOOL_ADMIN, check they don't already have a school
    if (user && user.role === Role.SCHOOL_ADMIN) {
      const existingAdmin = await this.prisma.schoolAdmin.findUnique({
        where: { userId: user.id },
      });
      if (existingAdmin) {
        throw new ForbiddenException('You already have a school assigned');
      }
    }

    const school = await this.prisma.school.create({
      data: {
        ...createSchoolDto,
        status: 'DRAFT',
        isVerified: false,
      },
    });

    // If user is SCHOOL_ADMIN, auto-assign them to the created school
    if (user && user.role === Role.SCHOOL_ADMIN) {
      await this.prisma.schoolAdmin.create({
        data: {
          userId: user.id,
          schoolId: school.id,
        },
      });
    }

    return {
      message: 'School created successfully',
      school,
    };
  }

  async findAll(filterDto: FilterSchoolDto) {
    const {
      search,
      district,
      province,
      schoolType,
      genderPolicy,
      boarding,
      page = 1,
      limit = 10,
    } = filterDto;

    const skip = (page - 1) * limit;

    const where: any = {
      isVerified: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
        { province: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (district) where.district = { contains: district, mode: 'insensitive' };
    if (province) where.province = { contains: province, mode: 'insensitive' };
    if (schoolType) where.schoolType = schoolType;
    if (genderPolicy) where.genderPolicy = genderPolicy;
    if (boarding !== undefined) where.boarding = boarding;

    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip,
        take: limit,
        include: {
          combinations: true,
          resources: true,
          fees: true,
          reviews: {
            select: {
              overallRating: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.school.count({ where }),
    ]);

    const schoolsWithRating = schools.map((school) => {
      const avgRating =
        school.reviews.length > 0
          ? school.reviews.reduce((sum, r) => sum + r.overallRating, 0) /
            school.reviews.length
          : 0;
      return {
        ...school,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: school.reviews.length,
      };
    });

    return {
      data: schoolsWithRating,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        combinations: true,
        resources: true,
        fees: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        schoolAdmin: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const avgRating =
      school.reviews.length > 0
        ? school.reviews.reduce((sum, r) => sum + r.overallRating, 0) /
          school.reviews.length
        : 0;

    return {
      ...school,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews: school.reviews.length,
    };
  }

  async update(id: string, updateSchoolDto: UpdateSchoolDto, userId?: string, userRole?: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // If user is SCHOOL_ADMIN, verify they own this school
    if (userId && userRole === Role.SCHOOL_ADMIN) {
      const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
        where: { userId, schoolId: id },
      });
      if (!schoolAdmin) {
        throw new NotFoundException('School not found');
      }
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: updateSchoolDto,
    });

    return {
      message: 'School updated successfully',
      school: updated,
    };
  }

  async remove(id: string) {
  const school = await this.prisma.school.findUnique({ where: { id } });

  if (!school) {
    throw new NotFoundException('School not found');
  }

  await this.prisma.fee.deleteMany({ where: { schoolId: id } });
  await this.prisma.combination.deleteMany({ where: { schoolId: id } });
  await this.prisma.schoolResource.deleteMany({ where: { schoolId: id } });
  await this.prisma.review.deleteMany({ where: { schoolId: id } });
  await this.prisma.favourite.deleteMany({ where: { schoolId: id } });
  await this.prisma.enquiry.deleteMany({ where: { schoolId: id } });

  await this.prisma.school.delete({ where: { id } });

  return {
    message: 'School deleted successfully',
  };
}

  async submitForVerification(id: string, userId?: string, userRole?: string) {
    const school = await this.prisma.school.findUnique({ where: { id } });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // If user is SCHOOL_ADMIN, verify they own this school
    if (userId && userRole === Role.SCHOOL_ADMIN) {
      const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
        where: { userId, schoolId: id },
      });
      if (!schoolAdmin) {
        throw new NotFoundException('School not found');
      }
    }

    const updated = await this.prisma.school.update({
      where: { id },
      data: { status: 'PENDING' },
    });

    return {
      message: 'School submitted for verification successfully',
      school: updated,
    };
  }

  async findNearby(lat: number, lng: number, radius: number = 10) {
    const schools = await this.prisma.school.findMany({
      where: {
        isVerified: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        combinations: true,
        resources: true,
      },
    });

    const nearbySchools = schools
      .map((school) => {
        const distance = this.calculateDistance(
          lat,
          lng,
          school.latitude!,
          school.longitude!,
        );
        return { ...school, distance: Math.round(distance * 10) / 10 };
      })
      .filter((school) => school.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return {
      data: nearbySchools,
      total: nearbySchools.length,
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}