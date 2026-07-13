// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getAllServices(query: any) {
    const { companyId, serviceTypeId, isActive, search, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (companyId) where.companyId = BigInt(companyId);
    if (serviceTypeId) where.serviceTypeId = BigInt(serviceTypeId);
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where.name = { contains: search };
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          company: {
            select: { id: true, name: true, city: true, verificationStatus: true },
          },
          serviceType: {
            include: { category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    const formattedServices = services.map(service => ({
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

  async getServiceById(id: bigint) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        company: { include: { ratingSummary: true, serviceAreas: true } },
        serviceType: { include: { category: true } },
      },
    });

    if (!service) throw new NotFoundException('Service not found');

    return {
      data: {
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
          rating: service.company.ratingSummary?.averageRating ? Number(service.company.ratingSummary.averageRating) : null,
          reviewCount: service.company.ratingSummary?.totalReviews || 0,
          serviceAreas: service.company.serviceAreas,
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
      },
    };
  }

  async createService(dto: CreateServiceDto, user: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: BigInt(dto.companyId) },
    });

    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== BigInt(user.id) && user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    const serviceType = await this.prisma.serviceType.findUnique({
      where: { id: BigInt(dto.serviceTypeId) },
    });

    if (!serviceType) throw new NotFoundException('Service type not found');

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
      },
    });

    return {
      message: 'Service created successfully',
      data: {
        ...service,
        id: service.id.toString(),
        companyId: service.companyId.toString(),
        serviceTypeId: service.serviceTypeId.toString(),
        basePrice: Number(service.basePrice),
      },
    };
  }

  async updateService(id: bigint, dto: UpdateServiceDto, user: any) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!service) throw new NotFoundException('Service not found');
    if (service.company.ownerId !== BigInt(user.id) && user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    if (dto.serviceTypeId) {
      const serviceType = await this.prisma.serviceType.findUnique({
        where: { id: BigInt(dto.serviceTypeId) },
      });
      if (!serviceType) throw new NotFoundException('Service type not found');
    }

    const updateData: any = { ...dto };
    if (dto.serviceTypeId) updateData.serviceTypeId = BigInt(dto.serviceTypeId);

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: updateData,
    });

    return {
      message: 'Service updated successfully',
      data: {
        ...updatedService,
        id: updatedService.id.toString(),
        companyId: updatedService.companyId.toString(),
        serviceTypeId: updatedService.serviceTypeId.toString(),
        basePrice: Number(updatedService.basePrice),
      },
    };
  }

  async deleteService(id: bigint, user: any) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        company: true,
        bookings: { where: { status: { in: ['pending', 'confirmed', 'in_progress'] } } },
      },
    });

    if (!service) throw new NotFoundException('Service not found');
    if (service.company.ownerId !== BigInt(user.id) && user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    if (service.bookings.length > 0) {
      throw new ConflictException('Cannot delete service with active bookings. Please complete or cancel them first.');
    }

    await this.prisma.service.delete({ where: { id } });

    return { message: 'Service deleted successfully' };
  }

  async getServicesByCompany(companyId: string) {
    const services = await this.prisma.service.findMany({
      where: { companyId: BigInt(companyId), isActive: true },
      include: {
        company: { select: { id: true, name: true, city: true, verificationStatus: true } },
        serviceType: { include: { category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedServices = services.map(service => ({
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

    return { data: formattedServices };
  }

  async getTrendingServices(query: any) {
    const { limit = 12, days = 7 } = query;
    const daysAgo = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const trendingServices = await this.prisma.service.findMany({
      where: {
        isActive: true,
        bookings: { some: { createdAt: { gte: daysAgo } } },
      },
      include: {
        company: { select: { id: true, name: true, city: true, logoUrl: true, verificationStatus: true } },
        serviceType: { include: { category: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { bookings: { _count: 'desc' } },
      take: Number(limit),
    });

    const formatted = trendingServices.map(service => ({
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
      isTrending: true,
    }));

    return { data: formatted, count: formatted.length };
  }
}

