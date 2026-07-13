// @ts-nocheck
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SavedItemDto } from './dto/saved-item.dto';

@Injectable()
export class SavedItemsService {
  constructor(private prisma: PrismaService) {}

  async getSavedItems(userId: bigint, query: any) {
    const { type, page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (type && ['company', 'service'].includes(type)) {
      where.itemType = type;
    }

    const [items, total] = await Promise.all([
      this.prisma.savedItem.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.savedItem.count({ where }),
    ]);

    const itemIds = items.map(i => i.itemId);
    const itemType = items[0]?.itemType || type;

    let enrichedItems: any[] = [];
    if (itemType === 'company' && itemIds.length > 0) {
      const companies = await this.prisma.company.findMany({
        where: { id: { in: itemIds } },
        select: {
          id: true, name: true, description: true, city: true, phone: true, email: true,
          logoUrl: true, coverImageUrl: true, verificationStatus: true, ratingSummary: true,
          services: { take: 3, select: { id: true, name: true } },
          _count: { select: { bookings: true } },
        },
      });
      const companyMap = new Map(companies.map(c => [c.id.toString(), c]));
      enrichedItems = items.map(saved => {
        const company = companyMap.get(saved.itemId.toString());
        if (!company) return null;
        return {
          id: saved.id.toString(),
          itemType: saved.itemType,
          itemId: saved.itemId.toString(),
          createdAt: saved.createdAt.toISOString(),
          item: {
            id: company.id.toString(),
            name: company.name,
            description: company.description,
            city: company.city,
            phone: company.phone,
            email: company.email,
            logoUrl: company.logoUrl,
            coverImageUrl: company.coverImageUrl,
            verified: company.verificationStatus === 'verified',
            rating: company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating) : 0,
            reviewCount: company.ratingSummary?.totalReviews || 0,
            jobsCount: company._count?.bookings || 0,
            services: company.services.map(s => ({ ...s, id: s.id.toString() })),
          },
        };
      }).filter(Boolean);
    } else if (itemType === 'service' && itemIds.length > 0) {
      const services = await this.prisma.service.findMany({
        where: { id: { in: itemIds } },
        select: {
          id: true, name: true, description: true, basePrice: true, durationMin: true, durationMax: true, image: true,
          company: {
            select: {
              id: true, name: true, city: true, logoUrl: true, verificationStatus: true, ratingSummary: true,
            },
          },
          serviceType: {
            select: { name: true, slug: true },
          },
        },
      });
      const serviceMap = new Map(services.map(s => [s.id.toString(), s]));
      enrichedItems = items.map(saved => {
        const service = serviceMap.get(saved.itemId.toString());
        if (!service) return null;
        return {
          id: saved.id.toString(),
          itemType: saved.itemType,
          itemId: saved.itemId.toString(),
          createdAt: saved.createdAt.toISOString(),
          item: {
            id: service.id.toString(),
            name: service.name,
            description: service.description,
            basePrice: Number(service.basePrice),
            durationMin: service.durationMin,
            durationMax: service.durationMax,
            image: service.image,
            company: service.company ? {
              id: service.company.id.toString(),
              name: service.company.name,
              city: service.company.city,
              logoUrl: service.company.logoUrl,
              verified: service.company.verificationStatus === 'verified',
              rating: service.company.ratingSummary?.averageRating ? Number(service.company.ratingSummary.averageRating) : 0,
              reviewCount: service.company.ratingSummary?.totalReviews || 0,
            } : null,
            category: service.serviceType?.name || 'Service',
          },
        };
      }).filter(Boolean);
    }

    return {
      items: enrichedItems,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async saveItem(userId: bigint, dto: SavedItemDto) {
    const item = dto.itemType === 'company'
      ? await this.prisma.company.findUnique({ where: { id: BigInt(dto.itemId) } })
      : await this.prisma.service.findUnique({ where: { id: BigInt(dto.itemId) } });

    if (!item) throw new NotFoundException(`${dto.itemType} not found`);

    const existing = await this.prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId,
          itemType: dto.itemType,
          itemId: BigInt(dto.itemId),
        },
      },
    });

    if (existing) throw new ConflictException('Item already saved');

    const savedItem = await this.prisma.savedItem.create({
      data: {
        userId,
        itemType: dto.itemType,
        itemId: BigInt(dto.itemId),
      },
    });

    return { savedItem: { id: savedItem.id.toString() }, message: 'Item saved successfully' };
  }

  async unsaveItem(userId: bigint, dto: SavedItemDto) {
    const deleted = await this.prisma.savedItem.deleteMany({
      where: {
        userId,
        itemType: dto.itemType,
        itemId: BigInt(dto.itemId),
      },
    });

    if (deleted.count === 0) throw new NotFoundException('Saved item not found');

    return { message: 'Item removed from saved' };
  }

  async checkSaved(userId: bigint, query: any) {
    const { itemType, itemIds } = query;

    if (!itemType || !itemIds) {
      throw new Error('itemType and itemIds are required');
    }

    const ids = itemIds.split(',').map(id => BigInt(id.trim()));

    const savedItems = await this.prisma.savedItem.findMany({
      where: {
        userId,
        itemType,
        itemId: { in: ids },
      },
    });

    const savedIds = new Set(savedItems.map(i => i.itemId.toString()));

    return {
      itemType,
      savedIds: itemIds.split(',').map(id => ({
        id: id.trim(),
        saved: savedIds.has(id.trim()),
      })),
    };
  }
}

