import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all company payouts (Admin)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'pending, completed, rejected',
  })
  @ApiQuery({ name: 'type', required: false, description: 'company' })
  getAllPayouts(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.payoutsService.getAllPayouts(status, type || 'company');
  }

  @Patch(':id/process')
  @ApiOperation({
    summary: 'Process a payout and mark it as completed (Admin)',
  })
  processPayout(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: { transactionId?: string },
  ) {
    return this.payoutsService.processPayout(
      id,
      BigInt(req.user.id),
      body?.transactionId,
    );
  }

  @Post(':id/approve')
  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Approve a payout and mark it as completed (Admin)',
  })
  approvePayout(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: { transactionId?: string },
  ) {
    return this.payoutsService.processPayout(
      id,
      BigInt(req.user.id),
      body?.transactionId,
    );
  }

  @Post(':id/reject')
  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Reject a payout and refund to company balance (Admin)',
  })
  rejectPayout(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    return this.payoutsService.rejectPayout(
      id,
      BigInt(req.user.id),
      body?.reason,
    );
  }
}
