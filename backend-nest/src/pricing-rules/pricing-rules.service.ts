import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';

@Injectable()
export class PricingRulesService {
  constructor(private prisma: PrismaService) {}

  private async getCompanyOrThrow(ownerId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId },
    });
    if (!company) {
      throw new NotFoundException('You do not own a company');
    }
    return company;
  }

  async getPricingRules(ownerId: bigint) {
    const company = await this.getCompanyOrThrow(ownerId);
    const rules = await this.prisma.pricingRule.findMany({
      where: { companyId: company.id },
      orderBy: { id: 'desc' },
    });
    return rules.map((r) => ({
      ...r,
      id: r.id.toString(),
      companyId: r.companyId.toString(),
      surchargePercent: Number(r.surchargePercent),
    }));
  }

  async createPricingRule(ownerId: bigint, dto: CreatePricingRuleDto) {
    const company = await this.getCompanyOrThrow(ownerId);

    const created = await this.prisma.pricingRule.create({
      data: {
        companyId: company.id,
        name: dto.name,
        dayOfWeek: dto.dayOfWeek !== undefined ? dto.dayOfWeek : null,
        startHour: dto.startHour !== undefined ? dto.startHour : null,
        endHour: dto.endHour !== undefined ? dto.endHour : null,
        surchargePercent: dto.surchargePercent,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return {
      ...created,
      id: created.id.toString(),
      companyId: created.companyId.toString(),
      surchargePercent: Number(created.surchargePercent),
    };
  }

  async toggleActive(ownerId: bigint, ruleId: number) {
    const company = await this.getCompanyOrThrow(ownerId);

    const rule = await this.prisma.pricingRule.findUnique({
      where: { id: ruleId },
    });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    if (rule.companyId !== company.id)
      throw new ForbiddenException('Access denied');

    const updated = await this.prisma.pricingRule.update({
      where: { id: ruleId },
      data: { isActive: !rule.isActive },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      companyId: updated.companyId.toString(),
      surchargePercent: Number(updated.surchargePercent),
    };
  }

  async deletePricingRule(ownerId: bigint, ruleId: number) {
    const company = await this.getCompanyOrThrow(ownerId);

    const rule = await this.prisma.pricingRule.findUnique({
      where: { id: ruleId },
    });
    if (!rule) throw new NotFoundException('Pricing rule not found');
    if (rule.companyId !== company.id)
      throw new ForbiddenException('Access denied');

    await this.prisma.pricingRule.delete({
      where: { id: ruleId },
    });

    return { success: true, message: 'Pricing rule deleted successfully' };
  }
}
