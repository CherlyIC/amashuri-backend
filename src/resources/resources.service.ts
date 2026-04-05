import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}
  
  async create(createResourceDto: CreateResourceDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: createResourceDto.schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }
    const existing = await this.prisma.schoolResource.findUnique({
      where: { schoolId: createResourceDto.schoolId },
    });

    if (existing) {
      throw new ConflictException(
        'Resources already exist for this school. Use update instead.',
      );
    }

    const resource = await this.prisma.schoolResource.create({
      data: createResourceDto,
    });

    return {
      message: 'School resources added successfully',
      resource,
    };
  }

  async findBySchool(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const resource = await this.prisma.schoolResource.findUnique({
      where: { schoolId },
    });

    if (!resource) {
      throw new NotFoundException('No resources found for this school');
    }

    return resource;
  }

  async update(id: string, data: Partial<CreateResourceDto>) {
    const resource = await this.prisma.schoolResource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException('Resources not found');
    }

    const updated = await this.prisma.schoolResource.update({
      where: { id },
      data,
    });

    return {
      message: 'School resources updated successfully',
      resource: updated,
    };
  }
}