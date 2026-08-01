import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SearchService } from '../search/search.service';
export declare class ServicesService {
    private prisma;
    private searchService;
    constructor(prisma: PrismaService, searchService: SearchService);
    getAllServices(query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            serviceTypeId: string;
            name: string;
            description: string | null;
            basePrice: number;
            platformFee: number;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
            image: string | null;
            checklist: import("@prisma/client/runtime/library").JsonValue;
            company: {
                id: string;
                name: string;
                city: string | null;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            };
            serviceType: {
                id: string;
                name: string;
                slug: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getServiceById(id: bigint): Promise<{
        id: string;
        companyId: string;
        serviceTypeId: string;
        name: string;
        description: string | null;
        basePrice: number;
        platformFee: number;
        durationMin: number;
        durationMax: number | null;
        image: string | null;
        features: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        company: {
            id: string;
            name: string;
            description: string | null;
            address: string | null;
            city: string | null;
            phone: string | null;
            email: string | null;
            verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            rating: number | null;
            reviewCount: number;
            serviceAreas: {
                id: bigint;
                companyId: bigint;
                city: string;
                coverageRadiusKm: number | null;
            }[];
            completedJobs: number;
            isInsured: boolean;
            completionRate: number;
        };
        serviceType: {
            id: string;
            name: string;
            slug: string;
            category: {
                id: string;
                name: string;
                slug: string;
            };
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
    createService(dto: CreateServiceDto, user: any): Promise<{
        message: string;
        data: {
            id: string;
            companyId: string;
            serviceTypeId: string;
            basePrice: number;
            checklist: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            image: string | null;
            description: string | null;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
        };
    }>;
    updateService(id: bigint, dto: UpdateServiceDto, user: any): Promise<{
        message: string;
        data: {
            id: string;
            companyId: string;
            serviceTypeId: string;
            basePrice: number;
            checklist: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            image: string | null;
            description: string | null;
            discountPrice: import("@prisma/client/runtime/library").Decimal | null;
            features: import("@prisma/client/runtime/library").JsonValue | null;
            durationMin: number;
            durationMax: number | null;
            isActive: boolean;
        };
    }>;
    deleteService(id: bigint, user: any): Promise<{
        message: string;
    }>;
    getServicesByCompany(companyId: string, query?: any): Promise<{
        data: {
            id: string;
            companyId: string;
            serviceTypeId: string;
            name: string;
            description: string | null;
            basePrice: number;
            durationMin: number;
            durationMax: number | null;
            image: string | null;
            features: import("@prisma/client/runtime/library").JsonValue;
            isActive: boolean;
            company: {
                id: string;
                name: string;
                city: string | null;
                verificationStatus: import(".prisma/client").$Enums.VerificationStatus;
            };
            serviceType: {
                id: string;
                name: string;
                slug: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getTrendingServices(query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            serviceTypeId: string;
            name: string;
            description: string | null;
            basePrice: number;
            platformFee: number;
            durationMin: number;
            durationMax: number | null;
            image: string | null;
            company: {
                id: string;
                name: string;
                city: string | null;
                logoUrl: string | null;
                verified: boolean;
                completedJobs: number;
                isInsured: boolean;
                completionRate: number;
            };
            serviceType: {
                id: string;
                name: string;
                slug: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
            bookingCount: number;
            isTrending: boolean;
        }[];
        count: number;
    }>;
    getDeals(query: any): Promise<{
        data: {
            id: string;
            companyId: string;
            serviceTypeId: string;
            name: string;
            description: string | null;
            basePrice: number;
            discountPrice: number | null;
            platformFee: number;
            durationMin: number;
            durationMax: number | null;
            image: string | null;
            company: {
                id: string;
                name: string;
                city: string | null;
                logoUrl: string | null;
                verified: boolean;
                completedJobs: number;
                isInsured: boolean;
                completionRate: number;
            };
            serviceType: {
                id: string;
                name: string;
                slug: string;
                category: {
                    id: string;
                    name: string;
                    slug: string;
                };
            };
        }[];
        count: number;
    }>;
}
