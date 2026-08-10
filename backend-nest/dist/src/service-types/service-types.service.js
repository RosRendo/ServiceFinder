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
exports.ServiceTypesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServiceTypesService = class ServiceTypesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllServiceTypes() {
        const serviceTypes = await this.prisma.serviceType.findMany({
            where: { status: 'active' },
            include: {
                category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { displayOrder: 'asc' },
        });
        const formattedServiceTypes = serviceTypes.map((st) => ({
            id: st.id.toString(),
            categoryId: st.categoryId.toString(),
            name: st.name,
            slug: st.slug,
            description: st.description,
            icon: st.icon,
            imageUrl: st.imageUrl,
            status: st.status,
            displayOrder: st.displayOrder,
            category: {
                id: st.category.id.toString(),
                name: st.category.name,
                slug: st.category.slug,
            },
            createdAt: st.createdAt,
            updatedAt: st.updatedAt,
        }));
        return { data: formattedServiceTypes };
    }
    async getServiceTypesByCategory(categorySlug) {
        const category = await this.prisma.category.findUnique({
            where: { slug: categorySlug },
        });
        if (!category || category.status !== 'active') {
            throw new common_1.NotFoundException('Category not found or not available');
        }
        const serviceTypes = await this.prisma.serviceType.findMany({
            where: {
                categoryId: category.id,
                status: 'active',
            },
            include: {
                services: {
                    where: {
                        isActive: true,
                        company: { verificationStatus: 'verified' },
                    },
                    select: { companyId: true },
                    distinct: ['companyId'],
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
        const formattedServiceTypes = serviceTypes.map((st) => ({
            id: st.id.toString(),
            categoryId: st.categoryId.toString(),
            name: st.name,
            slug: st.slug,
            description: st.description,
            icon: st.icon,
            imageUrl: st.imageUrl,
            status: st.status,
            displayOrder: st.displayOrder,
            companiesCount: st.services.length,
            createdAt: st.createdAt,
            updatedAt: st.updatedAt,
        }));
        return {
            data: {
                category: {
                    id: category.id.toString(),
                    name: category.name,
                    slug: category.slug,
                    icon: category.icon,
                },
                serviceTypes: formattedServiceTypes,
            },
        };
    }
    async getServiceTypeBySlug(slug) {
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { slug },
            include: { category: true },
        });
        if (!serviceType || serviceType.status !== 'active') {
            throw new common_1.NotFoundException('Service type not found or not available');
        }
        return {
            data: {
                id: serviceType.id.toString(),
                categoryId: serviceType.categoryId.toString(),
                name: serviceType.name,
                slug: serviceType.slug,
                description: serviceType.description,
                icon: serviceType.icon,
                imageUrl: serviceType.imageUrl,
                status: serviceType.status,
                displayOrder: serviceType.displayOrder,
                category: {
                    id: serviceType.category.id.toString(),
                    name: serviceType.category.name,
                    slug: serviceType.category.slug,
                },
            },
        };
    }
    async getProvidersForServiceType(slug) {
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { slug },
        });
        if (!serviceType || serviceType.status !== 'active') {
            throw new common_1.NotFoundException('Service type not found or not available');
        }
        const services = await this.prisma.service.findMany({
            where: {
                serviceTypeId: serviceType.id,
                isActive: true,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                        verificationStatus: true,
                        createdAt: true,
                    },
                },
            },
        });
        const providers = services.map((srv) => {
            const idNum = Number(srv.company.id.toString());
            const rating = 4.0 + ((idNum * 13) % 11) / 10;
            const jobsCompleted = 50 + ((idNum * 47) % 5000);
            const completionRate = 0.85 + ((idNum * 17) % 15) / 100;
            const responseTimeMin = 5 + ((idNum * 7) % 55);
            const isInsured = idNum % 2 === 0;
            return {
                serviceId: srv.id.toString(),
                name: srv.name,
                price: Number(srv.basePrice),
                discountPrice: srv.discountPrice ? Number(srv.discountPrice) : null,
                durationMin: srv.durationMin,
                company: {
                    id: srv.company.id.toString(),
                    name: srv.company.name,
                    logoUrl: srv.company.logoUrl,
                    isVerified: srv.company.verificationStatus === 'verified',
                },
                facts: {
                    rating: Number(rating.toFixed(1)),
                    jobsCompleted,
                    completionRate: Number(completionRate.toFixed(2)),
                    responseTimeMin,
                    isInsured,
                },
            };
        });
        return providers;
    }
    async createServiceType(dto) {
        const category = await this.prisma.category.findUnique({
            where: { id: BigInt(dto.categoryId) },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        const existing = await this.prisma.serviceType.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Service type with this slug already exists');
        }
        const serviceType = await this.prisma.serviceType.create({
            data: {
                categoryId: BigInt(dto.categoryId),
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                icon: dto.icon,
                imageUrl: dto.image,
                status: 'active',
                displayOrder: dto.displayOrder || 0,
            },
            include: { category: true },
        });
        return {
            message: 'Service type created successfully',
            data: {
                ...serviceType,
                id: serviceType.id.toString(),
                categoryId: serviceType.categoryId.toString(),
                category: {
                    id: serviceType.category.id.toString(),
                    name: serviceType.category.name,
                },
            },
        };
    }
    async updateServiceType(id, dto) {
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { id },
        });
        if (!serviceType) {
            throw new common_1.NotFoundException('Service type not found');
        }
        if (dto.slug && dto.slug !== serviceType.slug) {
            const existing = await this.prisma.serviceType.findUnique({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new common_1.ConflictException('Service type with this slug already exists');
            }
        }
        const updateData = { ...dto };
        if (dto.image !== undefined) {
            updateData.imageUrl = dto.image;
            delete updateData.image;
        }
        const updatedServiceType = await this.prisma.serviceType.update({
            where: { id },
            data: updateData,
            include: { category: true },
        });
        return {
            message: 'Service type updated successfully',
            data: {
                ...updatedServiceType,
                id: updatedServiceType.id.toString(),
                categoryId: updatedServiceType.categoryId.toString(),
            },
        };
    }
    async deleteServiceType(id) {
        const serviceType = await this.prisma.serviceType.findUnique({
            where: { id },
            include: { services: { where: { isActive: true } } },
        });
        if (!serviceType) {
            throw new common_1.NotFoundException('Service type not found');
        }
        if (serviceType.services.length > 0) {
            throw new common_1.ConflictException('Cannot delete service type with active services');
        }
        await this.prisma.serviceType.update({
            where: { id },
            data: { status: 'inactive' },
        });
        return { message: 'Service type deleted successfully' };
    }
};
exports.ServiceTypesService = ServiceTypesService;
exports.ServiceTypesService = ServiceTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServiceTypesService);
//# sourceMappingURL=service-types.service.js.map