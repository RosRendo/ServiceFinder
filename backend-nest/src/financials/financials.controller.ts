import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
import { PayoutRequestDto, ProcessPayoutDto } from './dto/financials.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Financials')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  // ================= COMPANY ROUTES =================

  @Get('financials/wallet')
  @Roles('company_admin')
  @ApiOperation({ summary: 'Get wallet balance and transaction history' })
  getWallet(@Request() req) {
    return this.financialsService.getWallet(req.user);
  }

  @Post('financials/payout-requests')
  @Roles('company_admin')
  @ApiOperation({ summary: 'Request a withdrawal from wallet' })
  requestPayout(@Body() dto: PayoutRequestDto, @Request() req) {
    return this.financialsService.requestPayout(dto, req.user);
  }

  // ================= ADMIN ROUTES =================

  @Get('admin/financials/payout-requests')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all pending payout requests' })
  getAllPayoutRequests() {
    return this.financialsService.getAllPayoutRequests();
  }

  @Patch('admin/financials/payout-requests/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve or reject a payout request' })
  processPayoutRequest(@Param('id') id: string, @Body() dto: ProcessPayoutDto) {
    return this.financialsService.processPayoutRequest(BigInt(id), dto);
  }
}
