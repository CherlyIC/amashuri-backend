import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeDto } from './dto/create-fee.dto';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  
  async create(createFeeDto: CreateFeeDto) {
  const school = await this.prisma.school.findUnique({
    where: { id: createFeeDto.schoolId },
  });

  if (!school) {
    throw new NotFoundException('School not found');
  }

  const fee = await this.prisma.fee.create({
    data: {
      schoolId: createFeeDto.schoolId!,
      level: createFeeDto.level,
      studentType: createFeeDto.studentType,
      amount: createFeeDto.amount,
      academicYear: createFeeDto.academicYear,
    },
  });

  return {
    message: 'Fee record created successfully',
    fee,
  };
}
  async findBySchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const fees = await this.prisma.fee.findMany({
      where: { schoolId },
      orderBy: { level: 'asc' },
    });

    return {
      data: fees,
      total: fees.length,
    };
  }

  // Update a fee record
  async update(id: string, data: Partial<CreateFeeDto>) {
    const fee = await this.prisma.fee.findUnique({ where: { id } });

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    const updated = await this.prisma.fee.update({
      where: { id },
      data,
    });

    return {
      message: 'Fee record updated successfully',
      fee: updated,
    };
  }

  async remove(id: string) {
    const fee = await this.prisma.fee.findUnique({ where: { id } });

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    await this.prisma.fee.delete({ where: { id } });

    return {
      message: 'Fee record deleted successfully',
    };
  }
}