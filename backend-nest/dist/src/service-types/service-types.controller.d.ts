import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
export declare class ServiceTypesController {
    private readonly serviceTypesService;
    constructor(serviceTypesService: ServiceTypesService);
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
    createServiceType(createServiceTypeDto: CreateServiceTypeDto): Promise<{
        message: string;
        data: {
            id: string;
            categoryId: string;
            category: {
                id: string;
                name: string;
            };
            slug: string;
            name: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.CategoryStatus;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    updateServiceType(id: string, updateServiceTypeDto: UpdateServiceTypeDto): Promise<{
        message: string;
        data: {
            id: string;
            categoryId: string;
            category: {
                id: bigint;
                slug: string;
                name: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
            };
            slug: string;
            name: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
            status: import(".prisma/client").$Enums.CategoryStatus;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    deleteServiceType(id: string): Promise<{
        message: string;
    }>;
}
