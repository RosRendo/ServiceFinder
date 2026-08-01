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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const search_service_1 = require("../search/search.service");
let ServicesService = class ServicesService {
    prisma;
    searchService;
    constructor(prisma, searchService) {
        this.prisma = prisma;
        this.searchService = searchService;
    }
    async getAllServices(query) {
        const { companyId, serviceTypeId, categoryId, isActive, search, minPrice, maxPrice, rating, page = 1, limit = 10, } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (companyId)
            where.companyId = BigInt(companyId);
        if (serviceTypeId)
            where.serviceTypeId = BigInt(serviceTypeId);
        if (categoryId) {
            const isNumeric = /^\d+$/.test(categoryId.toString());
            where.serviceType = {
                category: isNumeric ? { id: BigInt(categoryId) } : { slug: categoryId },
            };
        }
        if (isActive !== undefined)
            where.isActive = isActive === 'true' || isActive === true;
        if (minPrice)
            where.basePrice = { ...where.basePrice, gte: parseFloat(minPrice) };
        if (maxPrice)
            where.basePrice = { ...where.basePrice, lte: parseFloat(maxPrice) };
        if (rating) {
            where.company = {
                ratingSummary: { averageRating: { gte: parseFloat(rating) } },
            };
        }
        if (search) {
            if (this.searchService.isElasticActive()) {
                try {
                    const esResults = await this.searchService.searchServices(search);
                    const esIds = esResults.map((r) => BigInt(r.id));
                    if (esIds.length === 0) {
                        return {
                            data: [],
                            pagination: {
                                total: 0,
                                page: Number(page),
                                limit: Number(limit),
                                pages: 0,
                            },
                        };
                    }
                    where.id = { in: esIds };
                }
                catch (err) {
                    console.warn('Elasticsearch search error, falling back to DB contains search:', err);
                    where.name = { contains: search, mode: 'insensitive' };
                }
            }
            else {
                where.name = { contains: search, mode: 'insensitive' };
            }
        }
        const [services, total] = await Promise.all([
            this.prisma.service.findMany({
                where,
                skip: Number(skip),
                take: Number(limit),
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            verificationStatus: true,
                        },
                    },
                    serviceType: {
                        include: { category: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.service.count({ where }),
        ]);
        const formattedServices = services.map((service) => ({
            id: service.id.toString(),
            companyId: service.companyId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            platformFee: Number(service.basePrice) * 0.1,
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            isActive: service.isActive,
            image: service.image,
            checklist: service.checklist,
            company: {
                id: service.company.id.toString(),
                name: service.company.name,
                city: service.company.city,
                verificationStatus: service.company.verificationStatus,
            },
            serviceType: {
                id: service.serviceType.id.toString(),
                name: service.serviceType.name,
                slug: service.serviceType.slug,
                category: {
                    id: service.serviceType.category.id.toString(),
                    name: service.serviceType.category.name,
                    slug: service.serviceType.category.slug,
                },
            },
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        }));
        return {
            data: formattedServices,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        };
    }
    async getServiceById(id) {
        const service = await this.prisma.service.findUnique({
            where: { id },
            include: {
                company: { include: { ratingSummary: true, serviceAreas: true } },
                serviceType: { include: { category: true } },
            },
        });
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        return {
            id: service.id.toString(),
            companyId: service.companyId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            platformFee: Number(service.basePrice) * 0.1,
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            image: service.image,
            features: service.features,
            isActive: service.isActive,
            company: {
                id: service.company.id.toString(),
                name: service.company.name,
                description: service.company.description,
                address: service.company.address,
                city: service.company.city,
                phone: service.company.phone,
                email: service.company.email,
                verificationStatus: service.company.verificationStatus,
                rating: service.company.ratingSummary?.averageRating
                    ? Number(service.company.ratingSummary.averageRating)
                    : null,
                reviewCount: service.company.ratingSummary?.totalReviews || 0,
                serviceAreas: service.company.serviceAreas,
                completedJobs: service.company.completedJobs,
                isInsured: service.company.isInsured,
                completionRate: Number(service.company.completionRate),
            },
            serviceType: {
                id: service.serviceType.id.toString(),
                name: service.serviceType.name,
                slug: service.serviceType.slug,
                category: {
                    id: service.serviceType.category.id.toString(),
                    name: service.serviceType.category.name,
                    slug: service.serviceType.category.slug,
                },
            },
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        };
    }
    async createService(dto, user) {
        const company = await this.prisma.company.findUnique({
            where: { id: BigInt(dto.companyId) },
        });
        if (!company)
            throw new common_1.NotFoundException('Company not found');
        if (company.ownerId !== BigInt(user.id) && user.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { id: BigInt(dto.serviceTypeId) },
        });
        if (!serviceType)
            throw new common_1.NotFoundException('Service type not found');
        const service = await this.prisma.service.create({
            data: {
                companyId: BigInt(dto.companyId),
                serviceTypeId: BigInt(dto.serviceTypeId),
                name: dto.name,
                description: dto.description,
                image: dto.image,
                basePrice: dto.basePrice,
                durationMin: dto.durationMin,
                durationMax: dto.durationMax,
                features: dto.features || [],
                checklist: dto.checklist || [],
            },
        });
        const serviceWithCompany = await this.prisma.service.findUnique({
            where: { id: service.id },
            include: { company: true },
        });
        if (serviceWithCompany) {
            await this.searchService.indexService(serviceWithCompany);
        }
        return {
            message: 'Service created successfully',
            data: {
                ...service,
                id: service.id.toString(),
                companyId: service.companyId.toString(),
                serviceTypeId: service.serviceTypeId.toString(),
                basePrice: Number(service.basePrice),
                checklist: service.checklist,
            },
        };
    }
    async updateService(id, dto, user) {
        const service = await this.prisma.service.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        if (service.company.ownerId !== BigInt(user.id) && user.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (dto.serviceTypeId) {
            const serviceType = await this.prisma.serviceType.findUnique({
                where: { id: BigInt(dto.serviceTypeId) },
            });
            if (!serviceType)
                throw new common_1.NotFoundException('Service type not found');
        }
        const updateData = { ...dto };
        if (dto.serviceTypeId)
            updateData.serviceTypeId = BigInt(dto.serviceTypeId);
        const updatedService = await this.prisma.service.update({
            where: { id },
            data: updateData,
        });
        const serviceWithCompany = await this.prisma.service.findUnique({
            where: { id: updatedService.id },
            include: { company: true },
        });
        if (serviceWithCompany) {
            await this.searchService.indexService(serviceWithCompany);
        }
        return {
            message: 'Service updated successfully',
            data: {
                ...updatedService,
                id: updatedService.id.toString(),
                companyId: updatedService.companyId.toString(),
                serviceTypeId: updatedService.serviceTypeId.toString(),
                basePrice: Number(updatedService.basePrice),
                checklist: updatedService.checklist,
            },
        };
    }
    async deleteService(id, user) {
        const service = await this.prisma.service.findUnique({
            where: { id },
            include: {
                company: true,
                bookings: {
                    where: { status: { in: ['pending', 'confirmed', 'in_progress'] } },
                },
            },
        });
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        if (service.company.ownerId !== BigInt(user.id) && user.role !== 'admin') {
            throw new common_1.ForbiddenException('Access denied');
        }
        if (service.bookings.length > 0) {
            throw new common_1.ConflictException('Cannot delete service with active bookings. Please complete or cancel them first.');
        }
        await this.prisma.service.delete({ where: { id } });
        await this.searchService.removeService(id.toString());
        return { message: 'Service deleted successfully' };
    }
    async getServicesByCompany(companyId, query) {
        const { page = 1, limit = 20 } = query || {};
        const take = Math.min(Number(limit), 100);
        const skip = (Number(page) - 1) * take;
        const [services, total] = await Promise.all([
            this.prisma.service.findMany({
                where: { companyId: BigInt(companyId), isActive: true },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            verificationStatus: true,
                        },
                    },
                    serviceType: { include: { category: true } },
                },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.service.count({
                where: { companyId: BigInt(companyId), isActive: true },
            }),
        ]);
        const formattedServices = services.map((service) => ({
            id: service.id.toString(),
            companyId: service.companyId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            image: service.image,
            features: service.features,
            isActive: service.isActive,
            company: {
                id: service.company.id.toString(),
                name: service.company.name,
                city: service.company.city,
                verificationStatus: service.company.verificationStatus,
            },
            serviceType: {
                id: service.serviceType.id.toString(),
                name: service.serviceType.name,
                slug: service.serviceType.slug,
                category: {
                    id: service.serviceType.category.id.toString(),
                    name: service.serviceType.category.name,
                    slug: service.serviceType.category.slug,
                },
            },
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        }));
        return {
            data: formattedServices,
            pagination: {
                total,
                page: Number(page),
                limit: take,
                pages: Math.ceil(total / take),
            },
        };
    }
    async getTrendingServices(query) {
        const { limit = 12, days = 7 } = query;
        const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
        let trendingServices = await this.prisma.service.findMany({
            where: {
                isActive: true,
                bookings: { some: { createdAt: { gte: daysAgo } } },
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        logoUrl: true,
                        verificationStatus: true,
                        completedJobs: true,
                        isInsured: true,
                        completionRate: true,
                    },
                },
                serviceType: { include: { category: true } },
                _count: { select: { bookings: true } },
            },
            orderBy: { bookings: { _count: 'desc' } },
            take: Number(limit),
        });
        if (trendingServices.length === 0) {
            trendingServices = await this.prisma.service.findMany({
                where: { isActive: true },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                            city: true,
                            logoUrl: true,
                            verificationStatus: true,
                            completedJobs: true,
                            isInsured: true,
                            completionRate: true,
                        },
                    },
                    serviceType: { include: { category: true } },
                    _count: { select: { bookings: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
            });
        }
        const formatted = trendingServices.map((service) => ({
            id: service.id.toString(),
            companyId: service.companyId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            platformFee: Number(service.basePrice) * 0.1,
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            image: service.image,
            company: {
                id: service.company.id.toString(),
                name: service.company.name,
                city: service.company.city,
                logoUrl: service.company.logoUrl,
                verified: service.company.verificationStatus === 'verified',
                completedJobs: service.company.completedJobs,
                isInsured: service.company.isInsured,
                completionRate: Number(service.company.completionRate),
            },
            serviceType: {
                id: service.serviceType.id.toString(),
                name: service.serviceType.name,
                slug: service.serviceType.slug,
                category: {
                    id: service.serviceType.category.id.toString(),
                    name: service.serviceType.category.name,
                    slug: service.serviceType.category.slug,
                },
            },
            bookingCount: service._count.bookings,
            isTrending: service._count.bookings > 0,
        }));
        return { data: formatted, count: formatted.length };
    }
    async getDeals(query) {
        const { limit = 6 } = query;
        const deals = await this.prisma.service.findMany({
            where: {
                isActive: true,
                discountPrice: { not: null },
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                        logoUrl: true,
                        verificationStatus: true,
                        completedJobs: true,
                        isInsured: true,
                        completionRate: true,
                    },
                },
                serviceType: { include: { category: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
        });
        const formatted = deals.map((service) => ({
            id: service.id.toString(),
            companyId: service.companyId.toString(),
            serviceTypeId: service.serviceTypeId.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            discountPrice: service.discountPrice
                ? Number(service.discountPrice)
                : null,
            platformFee: Number(service.basePrice) * 0.1,
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            image: service.image,
            company: {
                id: service.company.id.toString(),
                name: service.company.name,
                city: service.company.city,
                logoUrl: service.company.logoUrl,
                verified: service.company.verificationStatus === 'verified',
                completedJobs: service.company.completedJobs,
                isInsured: service.company.isInsured,
                completionRate: Number(service.company.completionRate),
            },
            serviceType: {
                id: service.serviceType.id.toString(),
                name: service.serviceType.name,
                slug: service.serviceType.slug,
                category: {
                    id: service.serviceType.category.id.toString(),
                    name: service.serviceType.category.name,
                    slug: service.serviceType.category.slug,
                },
            },
        }));
        return { data: formatted, count: formatted.length };
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        search_service_1.SearchService])
], ServicesService);
//# sourceMappingURL=services.service.js.map