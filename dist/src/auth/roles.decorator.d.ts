export declare enum Role {
    USER = "USER",
    SCHOOL_ADMIN = "SCHOOL_ADMIN",
    ADMIN = "ADMIN"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
