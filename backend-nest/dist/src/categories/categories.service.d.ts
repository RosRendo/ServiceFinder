import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllCategories(includeInactive?: boolean): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
            useImageAsBadge: boolean;
            status: import(".prisma/client").$Enums.CategoryStatus;
            displayOrder: number;
            serviceTypesCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    getCategoryBySlug(slug: string): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
            useImageAsBadge: boolean;
            status: "active";
            serviceTypes: {
                id: string;
                categoryId: string;
                status: import(".prisma/client").$Enums.CategoryStatus;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                icon: string | null;
                imageUrl: string | null;
                displayOrder: number;
            }[];
        };
    }>;
    createCategory(dto: CreateCategoryDto): Promise<{
        message: string;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.CategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            icon: string | null;
            imageUrl: string | null;
            useImageAsBadge: boolean;
            displayOrder: number;
        };
    }>;
    updateCategory(id: bigint, dto: UpdateCategoryDto): Promise<{
        message: string;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.CategoryStatus;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            icon: string | null;
            imageUrl: string | null;
            useImageAsBadge: boolean;
            displayOrder: number;
        };
    }>;
    deleteCategory(id: bigint): Promise<{
        message: string;
    }>;
}
