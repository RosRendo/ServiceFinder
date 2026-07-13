// @ts-nocheck
import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async getAllCompanies(query: any) {
    const { status, city, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.verificationStatus = status;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: parseInt(skip.toString()),
        take: parseInt(limit.toString()),
        include: {
          owner: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
          ratingSummary: true,
          services: {
            where: { isActive: true },
            include: { serviceType: { include: { category: true } } }
          },
          _count: {
            select: { services: true, bookings: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      pagination: {
        total,
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCompanyById(id: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        services: {
          where: { isActive: true },
          include: { serviceType: { include: { category: true } } },
        },
        serviceAreas: { select: { city: true, coverageRadiusKm: true } },
        ratingSummary: true,
        staff: { where: { status: 'active' }, select: { id: true } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return { data: company };
  }

  async createCompany(userId: bigint, dto: CreateCompanyDto) {
    const existingCompany = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });

    if (existingCompany) {
      throw new ConflictException('User already has a company');
    }

    const company = await this.prisma.company.create({
      data: {
        ...dto,
        latitude: dto.latitude ? parseFloat(dto.latitude) : null,
        longitude: dto.longitude ? parseFloat(dto.longitude) : null,
        establishedYear: dto.establishedYear ? parseInt(dto.establishedYear) : null,
        ownerId: userId,
        verificationStatus: 'pending',
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { message: 'Company created successfully', company };
  }

  async updateCompany(id: bigint, userId: bigint, role: string, updates: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = { ...updates };
    if (updates.latitude !== undefined) {
      updateData.latitude = updates.latitude ? parseFloat(updates.latitude) : null;
    }
    if (updates.longitude !== undefined) {
      updateData.longitude = updates.longitude ? parseFloat(updates.longitude) : null;
    }
    if (updates.establishedYear !== undefined) {
      updateData.establishedYear = updates.establishedYear ? parseInt(updates.establishedYear) : null;
    }

    const updatedCompany = await this.prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
      },
    });

    return { message: 'Company updated successfully', company: updatedCompany };
  }

  async deleteCompany(id: bigint, userId: bigint, role: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.ownerId !== userId && role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.company.delete({ where: { id } });

    return { message: 'Company deleted successfully' };
  }
}

