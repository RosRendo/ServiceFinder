import { UserRole } from '@prisma/client';
export declare class UpdateUserAdminDto {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    avatar?: string;
}
