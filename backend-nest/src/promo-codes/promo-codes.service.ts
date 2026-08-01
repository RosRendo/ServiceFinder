import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async getAllPromoCodes() {
    const codes = await this.prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return codes.map(c => ({
      ...c,
      id: c.id.toString(),
      discountPercent: Number(c.discountPercent)
    }));
  }

  async createPromoCode(dto: CreatePromoCodeDto) {
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: dto.code.toUpperCase() }
    });
    if (existing) {
      throw new BadRequestException('Promo code already exists');
    }

    const created = await this.prisma.promoCode.create({
      data: {
        code: dto.code.toUpperCase(),
        discountPercent: dto.discountPercent,
        maxUses: dto.maxUses || null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      }
    });

    return {
      ...created,
      id: created.id.toString(),
      discountPercent: Number(created.discountPercent)
    };
  }

  async validatePromoCode(code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promo) {
      throw new NotFoundException('Invalid promo code');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Promo code is inactive');
    }

    if (promo.expiresAt && new Date() > promo.expiresAt) {
      throw new BadRequestException('Promo code has expired');
    }

    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Promo code usage limit reached');
    }

    return {
      valid: true,
      id: promo.id.toString(),
      code: promo.code,
      discountPercent: Number(promo.discountPercent)
    };
  }

  async toggleActive(id: number) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: { isActive: !promo.isActive }
    });

    return {
      ...updated,
      id: updated.id.toString(),
      discountPercent: Number(updated.discountPercent)
    };
  }

  async deletePromoCode(id: number) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');

    await this.prisma.promoCode.delete({ where: { id } });
    return { message: 'Promo code deleted successfully' };
  }
}
