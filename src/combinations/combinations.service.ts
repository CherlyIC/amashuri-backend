import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCombinationDto } from './dto/create-combination.dto';

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
      data: createCombinationDto,
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

  async remove(id: string) {
    const combination = await this.prisma.combination.findUnique({
      where: { id },
    });

    if (!combination) {
      throw new NotFoundException('Combination not found');
    }

    await this.prisma.combination.delete({ where: { id } });

    return {
      message: 'Combination deleted successfully',
    };
  }
}