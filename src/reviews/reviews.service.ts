import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Create a review
 async create(userId: string, createReviewDto: CreateReviewDto) {
  const school = await this.prisma.school.findUnique({
    where: { id: createReviewDto.schoolId },
  });

  if (!school) {
    throw new NotFoundException('School not found');
  }

  const review = await this.prisma.review.create({
    data: {
      schoolId: createReviewDto.schoolId!,
      userId,
      teachingRating: createReviewDto.teachingRating,
      facilitiesRating: createReviewDto.facilitiesRating,
      adminRating: createReviewDto.adminRating,
      overallRating: createReviewDto.overallRating,
      comment: createReviewDto.comment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return {
    message: 'Review submitted successfully',
    review,
  };
}

  // Get all reviews for a school
  async findBySchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { schoolId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average ratings
    const avgRatings =
      reviews.length > 0
        ? {
            teaching:
              Math.round(
                (reviews.reduce((sum, r) => sum + r.teachingRating, 0) /
                  reviews.length) *
                  10,
              ) / 10,
            facilities:
              Math.round(
                (reviews.reduce((sum, r) => sum + r.facilitiesRating, 0) /
                  reviews.length) *
                  10,
              ) / 10,
            admin:
              Math.round(
                (reviews.reduce((sum, r) => sum + r.adminRating, 0) /
                  reviews.length) *
                  10,
              ) / 10,
            overall:
              Math.round(
                (reviews.reduce((sum, r) => sum + r.overallRating, 0) /
                  reviews.length) *
                  10,
              ) / 10,
          }
        : null;

    return {
      data: reviews,
      total: reviews.length,
      avgRatings,
    };
  }

  // Get all reviews by a user
  async findByUser(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            district: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: reviews,
      total: reviews.length,
    };
  }

  // Update a review
  async update(id: string, userId: string, data: Partial<CreateReviewDto>) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data,
    });

    return {
      message: 'Review updated successfully',
      review: updated,
    };
  }

  // Delete a review
  async remove(id: string, userId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { school: { select: { name: true } } },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (userRole !== 'ADMIN' && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({ where: { id } });

    // Notify the review owner only when an admin removes it
    if (userRole === 'ADMIN' && review.userId !== userId) {
      await this.notifications.create(
        review.userId,
        'REVIEW_DELETED',
        'Your Review Was Removed',
        `Your review for ${review.school.name} was removed by an administrator`,
        '/my-reviews',
      );
    }

    return {
      message: 'Review deleted successfully',
    };
  }
}