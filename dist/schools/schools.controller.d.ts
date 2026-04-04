import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { FilterSchoolDto } from './dto/filter-school.dto';
export declare class SchoolsController {
    private schoolsService;
    constructor(schoolsService: SchoolsService);
    create(createSchoolDto: CreateSchoolDto): Promise<{
        message: string;
        school: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            district: string;
            province: string;
            schoolType: import(".prisma/client").$Enums.SchoolType;
            genderPolicy: import(".prisma/client").$Enums.GenderPolicy;
            boarding: boolean;
            phone: string | null;
            latitude: number | null;
            longitude: number | null;
            logoUrl: string | null;
            description: string | null;
            yearEstablished: number | null;
            totalStudents: number | null;
            status: import(".prisma/client").$Enums.SchoolStatus;
            isVerified: boolean;
        };
    }>;
    findAll(filterDto: FilterSchoolDto): Promise<{
        data: {
            avgRating: number;
            totalReviews: number;
            reviews: {
                overallRating: number;
            }[];
            fees: {
                id: string;
                schoolId: string;
                level: string;
                studentType: import(".prisma/client").$Enums.StudentType;
                amount: number;
                academicYear: string;
            }[];
            combinations: {
                id: string;
                name: string;
                schoolId: string;
                subjects: string;
            }[];
            resources: {
                id: string;
                schoolId: string;
                laboratory: boolean;
                library: boolean;
                computerRoom: boolean;
                sportsField: boolean;
                boardingHouse: boolean;
                chapel: boolean;
            } | null;
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            district: string;
            province: string;
            schoolType: import(".prisma/client").$Enums.SchoolType;
            genderPolicy: import(".prisma/client").$Enums.GenderPolicy;
            boarding: boolean;
            phone: string | null;
            latitude: number | null;
            longitude: number | null;
            logoUrl: string | null;
            description: string | null;
            yearEstablished: number | null;
            totalStudents: number | null;
            status: import(".prisma/client").$Enums.SchoolStatus;
            isVerified: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findNearby(lat: number, lng: number, radius: number): Promise<{
        data: {
            distance: number;
            combinations: {
                id: string;
                name: string;
                schoolId: string;
                subjects: string;
            }[];
            resources: {
                id: string;
                schoolId: string;
                laboratory: boolean;
                library: boolean;
                computerRoom: boolean;
                sportsField: boolean;
                boardingHouse: boolean;
                chapel: boolean;
            } | null;
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            district: string;
            province: string;
            schoolType: import(".prisma/client").$Enums.SchoolType;
            genderPolicy: import(".prisma/client").$Enums.GenderPolicy;
            boarding: boolean;
            phone: string | null;
            latitude: number | null;
            longitude: number | null;
            logoUrl: string | null;
            description: string | null;
            yearEstablished: number | null;
            totalStudents: number | null;
            status: import(".prisma/client").$Enums.SchoolStatus;
            isVerified: boolean;
        }[];
        total: number;
    }>;
    findOne(id: string): Promise<{
        avgRating: number;
        totalReviews: number;
        schoolAdmin: ({
            user: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            schoolId: string;
            userId: string;
            assignedAt: Date;
        }) | null;
        reviews: ({
            user: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            schoolId: string;
            userId: string;
            teachingRating: number;
            facilitiesRating: number;
            adminRating: number;
            overallRating: number;
            comment: string | null;
        })[];
        fees: {
            id: string;
            schoolId: string;
            level: string;
            studentType: import(".prisma/client").$Enums.StudentType;
            amount: number;
            academicYear: string;
        }[];
        combinations: {
            id: string;
            name: string;
            schoolId: string;
            subjects: string;
        }[];
        resources: {
            id: string;
            schoolId: string;
            laboratory: boolean;
            library: boolean;
            computerRoom: boolean;
            sportsField: boolean;
            boardingHouse: boolean;
            chapel: boolean;
        } | null;
        id: string;
        email: string | null;
        name: string;
        createdAt: Date;
        district: string;
        province: string;
        schoolType: import(".prisma/client").$Enums.SchoolType;
        genderPolicy: import(".prisma/client").$Enums.GenderPolicy;
        boarding: boolean;
        phone: string | null;
        latitude: number | null;
        longitude: number | null;
        logoUrl: string | null;
        description: string | null;
        yearEstablished: number | null;
        totalStudents: number | null;
        status: import(".prisma/client").$Enums.SchoolStatus;
        isVerified: boolean;
    }>;
    update(id: string, updateSchoolDto: UpdateSchoolDto): Promise<{
        message: string;
        school: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            district: string;
            province: string;
            schoolType: import(".prisma/client").$Enums.SchoolType;
            genderPolicy: import(".prisma/client").$Enums.GenderPolicy;
            boarding: boolean;
            phone: string | null;
            latitude: number | null;
            longitude: number | null;
            logoUrl: string | null;
            description: string | null;
            yearEstablished: number | null;
            totalStudents: number | null;
            status: import(".prisma/client").$Enums.SchoolStatus;
            isVerified: boolean;
        };
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    submitForVerification(id: string): Promise<{
        message: string;
        school: {
            id: string;
            email: string | null;
            name: string;
            createdAt: Date;
            district: string;
            province: string;
            schoolType: import(".prisma/client").$Enums.SchoolType;
            genderPolicy: import(".prisma/client").$Enums.GenderPolicy;
            boarding: boolean;
            phone: string | null;
            latitude: number | null;
            longitude: number | null;
            logoUrl: string | null;
            description: string | null;
            yearEstablished: number | null;
            totalStudents: number | null;
            status: import(".prisma/client").$Enums.SchoolStatus;
            isVerified: boolean;
        };
    }>;
}
