import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
export declare class ServiceTypesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllServiceTypes(): Promise<{
        data: {
            id: string;
            categoryId: string;
            name: string;
            slug: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.CategoryStatus;
            displayOrder: number;
            category: {
                id: string;
                name: string;
                slug: string;
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getServiceTypesByCategory(categorySlug: string): Promise<{
        data: {
            category: {
                id: string;
                name: string;
                slug: string;
                icon: string | null;
            };
            serviceTypes: {
                id: string;
                categoryId: string;
                name: string;
                slug: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                companiesCount: number;
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    getServiceTypeBySlug(slug: string): Promise<{
        data: {
            id: string;
            categoryId: string;
            name: string;
            slug: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
            status: "active";
            displayOrder: number;
            category: {
                id: string;
                name: string;
                slug: string;
            };
        };
    }>;
    getProvidersForServiceType(slug: string): Promise<{
        serviceId: string;
        name: string;
        price: number;
        discountPrice: number | null;
        durationMin: number;
        company: {
            id: string;
            name: string;
            logoUrl: string | null;
            isVerified: boolean;
        };
        facts: {
            rating: number;
            jobsCompleted: number;
            completionRate: number;
            responseTimeMin: number;
            isInsured: boolean;
        };
    }[]>;
    createServiceType(dto: CreateServiceTypeDto): Promise<{
        message: string;
        data: {
            id: string;
            categoryId: string;
            category: {
                id: string;
                name: string;
            };
            status: import(".prisma/client").$Enums.CategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            icon: string | null;
            imageUrl: string | null;
            displayOrder: number;
        };
    }>;
    updateServiceType(id: bigint, dto: UpdateServiceTypeDto): Promise<{
        message: string;
        data: {
            id: string;
            categoryId: string;
            category: {
                id: bigint;
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            };
            status: import(".prisma/client").$Enums.CategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            icon: string | null;
            imageUrl: string | null;
            displayOrder: number;
        };
    }>;
    deleteServiceType(id: bigint): Promise<{
        message: string;
    }>;
}
