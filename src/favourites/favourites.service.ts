import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavouritesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const existing = await this.prisma.favourite.findFirst({
      where: { userId, schoolId },
    });

    if (existing) {
      throw new ConflictException('School already saved to favourites');
    }

    const favourite = await this.prisma.favourite.create({
      data: { userId, schoolId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            district: true,
            province: true,
            schoolType: true,
            genderPolicy: true,
          },
        },
      },
    });

    return {
      message: 'School saved to favourites successfully',
      favourite,
    };
  }

  async findByUser(userId: string) {
    const favourites = await this.prisma.favourite.findMany({
      where: { userId },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            district: true,
            province: true,
            schoolType: true,
            genderPolicy: true,
            boarding: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    return {
      data: favourites,
      total: favourites.length,
    };
  }

  async remove(userId: string, schoolId: string) {
    const favourite = await this.prisma.favourite.findFirst({
      where: { userId, schoolId },
    });

    if (!favourite) {
      throw new NotFoundException('School not found in favourites');
    }

    await this.prisma.favourite.delete({
      where: { id: favourite.id },
    });

    return {
      message: 'School removed from favourites successfully',
    };
  }
}