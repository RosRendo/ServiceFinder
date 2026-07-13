import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAllCategories(): Promise<{
        data: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            icon: string | null;
            imageUrl: string | null;
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
            status: "active";
            serviceTypes: {
                id: string;
                categoryId: string;
                slug: string;
                name: string;
                description: string | null;
                icon: string | null;
                imageUrl: string | null;
                status: import(".prisma/client").$Enums.CategoryStatus;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    createCategory(dto: CreateCategoryDto): Promise<{
        message: string;
        data: {
            id: string;
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
    updateCategory(id: bigint, dto: UpdateCategoryDto): Promise<{
        message: string;
        data: {
            id: string;
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
    deleteCategory(id: bigint): Promise<{
        message: string;
    }>;
}
