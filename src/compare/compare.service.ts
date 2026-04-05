import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompareDto } from './dto/create-compare.dto';

@Injectable()
export class CompareService {
  constructor(private prisma: PrismaService) {}

  
  async compare(userId: string, createCompareDto: CreateCompareDto) {
    const { schoolIds } = createCompareDto;

    const schools = await Promise.all(
      schoolIds.map((id) =>
        this.prisma.school.findUnique({
          where: { id },
          include: {
            combinations: true,
            resources: true,
            fees: true,
            reviews: {
              select: { overallRating: true },
            },
          },
        }),
      ),
    );

    schools.forEach((school, index) => {
      if (!school) {
        throw new NotFoundException(
          `School with id ${schoolIds[index]} not found`,
        );
      }
    });

    const schoolsWithRating = schools.map((school) => {
      const avgRating =
        school!.reviews.length > 0
          ? school!.reviews.reduce((sum, r) => sum + r.overallRating, 0) /
            school!.reviews.length
          : 0;
      return {
        ...school,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: school!.reviews.length,
      };
    });

    await this.prisma.comparison.create({
      data: {
        userId,
        schoolIds,
      },
    });

    return {
      message: 'Comparison successful',
      data: schoolsWithRating,
      total: schoolsWithRating.length,
    };
  }


  async getHistory(userId: string) {
    const history = await this.prisma.comparison.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: history,
      total: history.length,
    };
  }
}