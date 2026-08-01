import { Controller, Get, Post, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PricingRulesService } from './pricing-rules.service';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Pricing Rules')
@Controller('companies/my-company/pricing-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('company_admin')
@ApiBearerAuth()
export class PricingRulesController {
  constructor(private readonly pricingRulesService: PricingRulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all pricing rules for the company' })
  getPricingRules(@CurrentUser() user: any) {
    return this.pricingRulesService.getPricingRules(BigInt(user.id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new pricing rule' })
  createPricingRule(@Body() dto: CreatePricingRuleDto, @CurrentUser() user: any) {
    return this.pricingRulesService.createPricingRule(BigInt(user.id), dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle pricing rule active state' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.pricingRulesService.toggleActive(BigInt(user.id), Number(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pricing rule' })
  deletePricingRule(@Param('id') id: string, @CurrentUser() user: any) {
    return this.pricingRulesService.deletePricingRule(BigInt(user.id), Number(id));
  }
}
