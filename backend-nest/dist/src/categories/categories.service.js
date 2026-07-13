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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllCategories() {
        const categories = await this.prisma.category.findMany({
            where: { status: 'active' },
            include: {
                serviceTypes: {
                    where: { status: 'active' },
                    select: { id: true },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
        const formattedCategories = categories.map((cat) => ({
            id: cat.id.toString(),
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            imageUrl: cat.imageUrl,
            status: cat.status,
            displayOrder: cat.displayOrder,
            serviceTypesCount: cat.serviceTypes.length,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
        }));
        return { data: formattedCategories };
    }
    async getCategoryBySlug(slug) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
            include: {
                serviceTypes: {
                    where: { status: 'active' },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
        if (!category || category.status !== 'active') {
            throw new common_1.NotFoundException('Category not found or not available');
        }
        const formattedServiceTypes = category.serviceTypes.map((st) => ({
            ...st,
            id: st.id.toString(),
            categoryId: st.categoryId.toString(),
        }));
        return {
            data: {
                id: category.id.toString(),
                name: category.name,
                slug: category.slug,
                description: category.description,
                icon: category.icon,
                imageUrl: category.imageUrl,
                status: category.status,
                serviceTypes: formattedServiceTypes,
            },
        };
    }
    async createCategory(dto) {
        const existing = await this.prisma.category.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Category with this slug already exists');
        }
        const category = await this.prisma.category.create({
            data: {
                ...dto,
                status: 'active',
                displayOrder: dto.displayOrder || 0,
            },
        });
        return {
            message: 'Category created successfully',
            data: {
                ...category,
                id: category.id.toString(),
            },
        };
    }
    async updateCategory(id, dto) {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (dto.slug && dto.slug !== category.slug) {
            const existing = await this.prisma.category.findUnique({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new common_1.ConflictException('Category with this slug already exists');
            }
        }
        const updatedCategory = await this.prisma.category.update({
            where: { id },
            data: dto,
        });
        return {
            message: 'Category updated successfully',
            data: {
                ...updatedCategory,
                id: updatedCategory.id.toString(),
            },
        };
    }
    async deleteCategory(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: { serviceTypes: true },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (category.serviceTypes.length > 0) {
            throw new common_1.ConflictException('Cannot delete category with existing service types');
        }
        await this.prisma.category.update({
            where: { id },
            data: { status: 'inactive' },
        });
        return { message: 'Category deleted successfully' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map