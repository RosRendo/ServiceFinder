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
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Staff Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('staff')
@Controller('staff')
export class StaffPayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly prisma: PrismaService,
  ) {}

  private async getStaffId(req: any): Promise<bigint> {
    const staff = await this.prisma.companyStaff.findFirst({
      where: { userId: BigInt(req.user.id) },
    });
    if (!staff) throw new NotFoundException('You are not registered as staff');
    return staff.id;
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Get payout history for staff' })
  async getPayouts(@Request() req: any) {
    const staffId = await this.getStaffId(req);
    return this.payoutsService.getStaffPayouts(staffId);
  }

  @Post('payouts/request')
  @ApiOperation({ summary: 'Request a payout' })
  async requestPayout(
    @Request() req: any,
    @Body() body: { amount: number; method: string },
  ) {
    const staffId = await this.getStaffId(req);
    return this.payoutsService.requestStaffPayout(
      staffId,
      body.amount,
      body.method,
    );
  }

  @Get('payment-methods')
  @ApiOperation({ summary: 'Get saved payment methods' })
  async getPaymentMethods(@Request() req: any) {
    const staffId = await this.getStaffId(req);
    return this.payoutsService.getStaffPaymentMethods(staffId);
  }

  @Post('payment-methods')
  @ApiOperation({ summary: 'Add a payment method' })
  async addPaymentMethod(@Request() req: any, @Body() body: any) {
    const staffId = await this.getStaffId(req);
    return this.payoutsService.addStaffPaymentMethod(staffId, body);
  }

  @Patch('payment-methods/:id')
  @ApiOperation({ summary: 'Update a payment method' })
  async updatePaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: any,
  ) {
    const staffId = await this.getStaffId(req);
    return this.payoutsService.updateStaffPaymentMethod(id, staffId, body);
  }

  @Delete('payment-methods/:id')
  @ApiOperation({ summary: 'Delete a payment method' })
  async deletePaymentMethod(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const staffId = await this.getStaffId(req);
    return this.payoutsService.deleteStaffPaymentMethod(id, staffId);
  }
}
