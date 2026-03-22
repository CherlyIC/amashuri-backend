import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<{
        id: number;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    } | null>;
    findById(id: number): Promise<{
        id: number;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    } | null>;
    createUser(data: {
        name: string;
        email: string;
        passwordHash: string;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
}
