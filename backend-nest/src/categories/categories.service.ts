import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

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

  async getCategoryBySlug(slug: string) {
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
      throw new NotFoundException('Category not found or not available');
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

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
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

  async updateCategory(id: bigint, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: dto as any,
    });

    return {
      message: 'Category updated successfully',
      data: {
        ...updatedCategory,
        id: updatedCategory.id.toString(),
      },
    };
  }

  async deleteCategory(id: bigint) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { serviceTypes: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.serviceTypes.length > 0) {
      throw new ConflictException(
        'Cannot delete category with existing service types',
      );
    }

    await this.prisma.category.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return { message: 'Category deleted successfully' };
  }
}
