import { Test, TestingModule } from '@nestjs/testing';
import { SchoolsService } from './schools.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  school: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  fee: { deleteMany: jest.fn() },
  combination: { deleteMany: jest.fn() },
  schoolResource: { deleteMany: jest.fn() },
  review: { deleteMany: jest.fn() },
  favourite: { deleteMany: jest.fn() },
  enquiry: { deleteMany: jest.fn() },
};

describe('SchoolsService', () => {
  let schoolsService: SchoolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    schoolsService = module.get<SchoolsService>(SchoolsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return array of schools with meta', async () => {
      mockPrismaService.school.findMany.mockResolvedValue([
        {
          id: 'uuid-1',
          name: 'Test School',
          district: 'Gasabo',
          province: 'Kigali',
          isVerified: true,
          reviews: [],
        },
      ]);
      mockPrismaService.school.count.mockResolvedValue(1);

      const result = await schoolsService.findAll({ page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a school when valid ID is provided', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({
        id: 'uuid-1',
        name: 'Test School',
        district: 'Gasabo',
        reviews: [],
      });

      const result = await schoolsService.findOne('uuid-1');
      expect(result.name).toBe('Test School');
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue(null);

      await expect(
        schoolsService.findOne('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a school successfully', async () => {
      const schoolData = {
        name: 'New School',
        district: 'Gasabo',
        province: 'Kigali',
        schoolType: 'PUBLIC' as any,
        genderPolicy: 'COED' as any,
      };

      mockPrismaService.school.create.mockResolvedValue({
        id: 'uuid-1',
        ...schoolData,
        status: 'DRAFT',
        isVerified: false,
      });

      const result = await schoolsService.create(schoolData);
      expect(result.message).toBe('School created successfully');
      expect(result.school.name).toBe('New School');
    });
  });

  describe('remove', () => {
    it('should delete a school successfully', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue({
        id: 'uuid-1',
        name: 'Test School',
      });
      mockPrismaService.fee.deleteMany.mockResolvedValue({});
      mockPrismaService.combination.deleteMany.mockResolvedValue({});
      mockPrismaService.schoolResource.deleteMany.mockResolvedValue({});
      mockPrismaService.review.deleteMany.mockResolvedValue({});
      mockPrismaService.favourite.deleteMany.mockResolvedValue({});
      mockPrismaService.enquiry.deleteMany.mockResolvedValue({});
      mockPrismaService.school.delete.mockResolvedValue({});

      const result = await schoolsService.remove('uuid-1');
      expect(result.message).toBe('School deleted successfully');
    });

    it('should throw NotFoundException when school not found', async () => {
      mockPrismaService.school.findUnique.mockResolvedValue(null);

      await expect(
        schoolsService.remove('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});