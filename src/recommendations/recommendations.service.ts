import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string) {
    const userFavourites = await this.prisma.favourite.findMany({
      where: { userId },
      include: {
        school: {
          select: {
            district: true,
            schoolType: true,
            genderPolicy: true,
            boarding: true,
          },
        },
      },
    });

    const userComparisons = await this.prisma.comparison.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    
    if (userFavourites.length === 0 && userComparisons.length === 0) {
      return this.getTopRatedSchools();
    }

    // Analyze user preferences from favourites
    const preferences = this.analyzePreferences(userFavourites);

    const recommendedSchools = await this.prisma.school.findMany({
      where: {
        isVerified: true,
        AND: [
          preferences.district
            ? { district: preferences.district }
            : {},
          preferences.schoolType
            ? { schoolType: preferences.schoolType as any }
            : {},
          preferences.genderPolicy
            ? { genderPolicy: preferences.genderPolicy as any }
            : {},
        ],
      },
      include: {
        combinations: true,
        resources: true,
        reviews: {
          select: { overallRating: true },
        },
      },
      take: 10,
    });

    const schoolsWithRating = recommendedSchools
      .map((school) => {
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
      })
      .sort((a, b) => b.avgRating - a.avgRating);

    return {
      message: 'Recommendations based on your preferences',
      preferences,
      data: schoolsWithRating,
      total: schoolsWithRating.length,
    };
  }

  async getSimilarSchools(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: { combinations: true },
    });

    if (!school) {
      return { data: [], total: 0 };
    }

    const similarSchools = await this.prisma.school.findMany({
      where: {
        isVerified: true,
        id: { not: schoolId },
        OR: [
          { district: school.district },
          { schoolType: school.schoolType },
          { genderPolicy: school.genderPolicy },
        ],
      },
      include: {
        combinations: true,
        resources: true,
        reviews: {
          select: { overallRating: true },
        },
      },
      take: 6,
    });

    const schoolsWithRating = similarSchools.map((s) => {
      const avgRating =
        s.reviews.length > 0
          ? s.reviews.reduce((sum, r) => sum + r.overallRating, 0) /
            s.reviews.length
          : 0;
      return {
        ...s,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: s.reviews.length,
      };
    });

    return {
      message: 'Similar schools',
      data: schoolsWithRating,
      total: schoolsWithRating.length,
    };
  }

  private async getTopRatedSchools() {
    const schools = await this.prisma.school.findMany({
      where: { isVerified: true },
      include: {
        combinations: true,
        resources: true,
        reviews: {
          select: { overallRating: true },
        },
      },
      take: 10,
    });

    const schoolsWithRating = schools
      .map((school) => {
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
      })
      .sort((a, b) => b.avgRating - a.avgRating);

    return {
      message: 'Top rated schools',
      data: schoolsWithRating,
      total: schoolsWithRating.length,
    };
  }

  private analyzePreferences(favourites: any[]) {
    if (favourites.length === 0) return {};
    const districts: Record<string, number> = {};
    const schoolTypes: Record<string, number> = {};
    const genderPolicies: Record<string, number> = {};

    favourites.forEach((fav) => {
      const school = fav.school;
      districts[school.district] = (districts[school.district] || 0) + 1;
      schoolTypes[school.schoolType] =
        (schoolTypes[school.schoolType] || 0) + 1;
      genderPolicies[school.genderPolicy] =
        (genderPolicies[school.genderPolicy] || 0) + 1;
    });

    const district = Object.keys(districts).reduce((a, b) =>
      districts[a] > districts[b] ? a : b,
    );
    const schoolType = Object.keys(schoolTypes).reduce((a, b) =>
      schoolTypes[a] > schoolTypes[b] ? a : b,
    );
    const genderPolicy = Object.keys(genderPolicies).reduce((a, b) =>
      genderPolicies[a] > genderPolicies[b] ? a : b,
    );

    return { district, schoolType, genderPolicy };
  }
}