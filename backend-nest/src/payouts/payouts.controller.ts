import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Company Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('company_admin')
@Controller('company')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  private async getCompanyId(req: any): Promise<bigint> {
    if (req.user.companyId) return BigInt(req.user.companyId);

    // For company_admin, their user.id is the ownerId
    const company = await this.payoutsService.getCompanyByOwnerId(
      BigInt(req.user.id),
    );

    const fs = require('fs');
    fs.writeFileSync(
      'debug_payouts.json',
      JSON.stringify(
        {
          userId: req.user.id.toString(),
          userRole: req.user.role,
          companyFound: company ? company.id.toString() : null,
        },
        null,
        2,
      ),
    );

    if (!company) {
      throw new NotFoundException('No company associated with this user');
    }
    return company.id;
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get payout history for company' })
  async getPayouts(@Request() req: any) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.getPayouts(companyId);
  }

  @Post('payouts/request')
  @ApiOperation({ summary: 'Request a payout' })
  async requestPayout(
    @Request() req: any,
    @Body() body: { amount: number; method: string },
  ) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.requestPayout(
      companyId,
      body.amount,
      body.method,
    );
  }

  @Get('staff/:staffId/payouts')
  @ApiOperation({ summary: 'Get payout requests from a specific staff member' })
  async getStaffPayouts(
    @Param('staffId') staffId: string,
    @Request() req: any,
  ) {
    try {
      const companyId = await this.getCompanyId(req);
      return await this.payoutsService.getStaffPayoutsForCompanyMember(
        BigInt(staffId),
        companyId,
      );
    } catch (e: any) {
      console.error('\n\n=========================================\nCRITICAL CONTROLLER ERROR:', e, '\n=========================================\n\n');
      throw e;
    }
  }

  @Patch('payouts/:id/approve')
  @ApiOperation({ summary: 'Approve a staff payout request' })
  async approveStaffPayout(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.approveStaffPayout(id, companyId);
  }

  @Patch('payouts/:id/reject')
  @ApiOperation({ summary: 'Reject a staff payout request' })
  async rejectStaffPayout(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.rejectStaffPayout(id, companyId);
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get saved payment methods' })
  async getPaymentMethods(@Request() req: any) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.getPaymentMethods(companyId);
  }

  @Post('payment-methods')
  @ApiOperation({ summary: 'Add a payment method' })
  async addPaymentMethod(@Request() req: any, @Body() body: any) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.addPaymentMethod(companyId, body);
  }

  @Patch('payment-methods/:id')
  @ApiOperation({ summary: 'Update a payment method' })
  async updatePaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: any,
  ) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.updatePaymentMethod(id, companyId, body);
  }

  @Delete('payment-methods/:id')
  @ApiOperation({ summary: 'Delete a payment method' })
  async deletePaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const companyId = await this.getCompanyId(req);
    return this.payoutsService.deletePaymentMethod(id, companyId);
  }
}
