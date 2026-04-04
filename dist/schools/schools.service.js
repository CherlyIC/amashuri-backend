"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SchoolsService = class SchoolsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createSchoolDto) {
        const school = await this.prisma.school.create({
            data: {
                ...createSchoolDto,
                status: 'DRAFT',
                isVerified: false,
            },
        });
        return {
            message: 'School created successfully',
            school,
        };
    }
    async findAll(filterDto) {
        const { search, district, province, schoolType, genderPolicy, boarding, page = 1, limit = 10, } = filterDto;
        const skip = (page - 1) * limit;
        const where = {
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
        if (district)
            where.district = { contains: district, mode: 'insensitive' };
        if (province)
            where.province = { contains: province, mode: 'insensitive' };
        if (schoolType)
            where.schoolType = schoolType;
        if (genderPolicy)
            where.genderPolicy = genderPolicy;
        if (boarding !== undefined)
            where.boarding = boarding;
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
            const avgRating = school.reviews.length > 0
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('School not found');
        }
        const avgRating = school.reviews.length > 0
            ? school.reviews.reduce((sum, r) => sum + r.overallRating, 0) /
                school.reviews.length
            : 0;
        return {
            ...school,
            avgRating: Math.round(avgRating * 10) / 10,
            totalReviews: school.reviews.length,
        };
    }
    async update(id, updateSchoolDto) {
        const school = await this.prisma.school.findUnique({ where: { id } });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
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
    async remove(id) {
        const school = await this.prisma.school.findUnique({ where: { id } });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
        }
        await this.prisma.school.delete({ where: { id } });
        return {
            message: 'School deleted successfully',
        };
    }
    async submitForVerification(id) {
        const school = await this.prisma.school.findUnique({ where: { id } });
        if (!school) {
            throw new common_1.NotFoundException('School not found');
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
    async findNearby(lat, lng, radius = 10) {
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
            const distance = this.calculateDistance(lat, lng, school.latitude, school.longitude);
            return { ...school, distance: Math.round(distance * 10) / 10 };
        })
            .filter((school) => school.distance <= radius)
            .sort((a, b) => a.distance - b.distance);
        return {
            data: nearbySchools,
            total: nearbySchools.length,
        };
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(value) {
        return (value * Math.PI) / 180;
    }
};
exports.SchoolsService = SchoolsService;
exports.SchoolsService = SchoolsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SchoolsService);
//# sourceMappingURL=schools.service.js.map