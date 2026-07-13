import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  // --- Company Endpoints ---

  @Get('company/:id')
  @Roles('company_admin')
  getCompanyWallet(@Param('id') id: string, @Request() req: any) {
    return this.walletsService.getCompanyWallet(
      BigInt(id),
      BigInt(req.user.id),
    );
  }

  @Post('company/:id/deposit')
  @Roles('company_admin')
  requestDeposit(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    dto: { amount: number; bankName: string; proofOfTransferUrl: string },
  ) {
    return this.walletsService.requestDeposit(
      BigInt(id),
      BigInt(req.user.id),
      dto,
    );
  }

  @Post('company/:id/payout')
  @Roles('company_admin')
  requestPayout(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    dto: {
      amount: number;
      destinationBank: string;
      accountName: string;
      accountNumber: string;
    },
  ) {
    return this.walletsService.requestPayout(
      BigInt(id),
      BigInt(req.user.id),
      dto,
    );
  }

  @Post('company/:id/staff/:staffId/clear-debt')
  @Roles('company_admin')
  clearStaffDebt(
    @Param('id') id: string,
    @Param('staffId') staffId: string,
    @Request() req: any,
    @Body() dto: { amount: number },
  ) {
    return this.walletsService.clearStaffDebt(
      BigInt(id),
      BigInt(staffId),
      BigInt(req.user.id),
      dto.amount,
    );
  }

  // --- Staff Endpoints ---

  @Get('staff/:id')
  @Roles('staff')
  getStaffWallet(@Param('id') id: string, @Request() req: any) {
    return this.walletsService.getStaffWallet(BigInt(id), BigInt(req.user.id));
  }

  @Post('staff/:id/payout')
  @Roles('staff')
  requestStaffPayout(
    @Param('id') id: string,
    @Request() req: any,
    @Body()
    dto: {
      amount: number;
      destinationBank: string;
      accountName: string;
      accountNumber: string;
    },
  ) {
    return this.walletsService.requestStaffPayout(
      BigInt(id),
      BigInt(req.user.id),
      dto,
    );
  }

  // --- Admin Endpoints ---

  @Get('admin/requests')
  @Roles('admin')
  getAdminPendingRequests() {
    return this.walletsService.getAdminPendingRequests();
  }

  @Patch('admin/deposits/:id/approve')
  @Roles('admin')
  approveDeposit(
    @Param('id') id: string,
    @Body() dto: { adminNotes?: string },
  ) {
    return this.walletsService.approveDeposit(BigInt(id), dto.adminNotes);
  }

  @Patch('admin/deposits/:id/reject')
  @Roles('admin')
  rejectDeposit(@Param('id') id: string, @Body() dto: { adminNotes?: string }) {
    return this.walletsService.rejectDeposit(BigInt(id), dto.adminNotes);
  }

  @Patch('admin/payouts/:id/approve')
  @Roles('admin')
  approvePayout(@Param('id') id: string, @Body() dto: { adminNotes?: string }) {
    return this.walletsService.approvePayout(BigInt(id), dto.adminNotes);
  }

  @Patch('admin/payouts/:id/reject')
  @Roles('admin')
  rejectPayout(@Param('id') id: string, @Body() dto: { adminNotes?: string }) {
    return this.walletsService.rejectPayout(BigInt(id), dto.adminNotes);
  }
}
