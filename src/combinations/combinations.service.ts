import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCombinationDto } from './dto/create-combination.dto';
import { Role } from '../auth/roles.decorator';

@Injectable()
export class CombinationsService {
  constructor(private prisma: PrismaService) {}

  async create(createCombinationDto: CreateCombinationDto) {
  const school = await this.prisma.school.findUnique({
    where: { id: createCombinationDto.schoolId },
  });

  if (!school) {
    throw new NotFoundException('School not found');
  }

  const combination = await this.prisma.combination.create({
    data: {
      schoolId: createCombinationDto.schoolId!,
      name: createCombinationDto.name,
      subjects: createCombinationDto.subjects,
    },
  });

  return {
    message: 'Combination added successfully',
    combination,
  };
}
  async findBySchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const combinations = await this.prisma.combination.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });

    return {
      data: combinations,
      total: combinations.length,
    };
  }

  async remove(id: string, userId?: string, userRole?: string) {
    const combination = await this.prisma.combination.findUnique({
      where: { id },
      include: { school: true },
    });

    if (!combination) {
      throw new NotFoundException('Combination not found');
    }

    // If userId is provided and user is not ADMIN, verify ownership
    if (userId && userRole !== Role.ADMIN) {
      const schoolAdmin = await this.prisma.schoolAdmin.findFirst({
        where: { userId, schoolId: combination.schoolId },
      });
      if (!schoolAdmin) {
        throw new NotFoundException('Combination not found');
      }
    }

    await this.prisma.combination.delete({ where: { id } });

    return {
      message: 'Combination deleted successfully',
    };
  }
}