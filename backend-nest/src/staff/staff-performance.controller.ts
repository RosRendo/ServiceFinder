import {
  Controller,
  Get,
  Put,
  Body,
  Param,
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
import { StaffPerformanceService } from './staff-performance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffPerformanceController {
  constructor(
    private readonly staffPerformanceService: StaffPerformanceService,
  ) {}

  @Get('performance')
  @ApiOperation({ summary: 'Get own performance metrics' })
  getMyPerformance(@Request() req: any) {
    return this.staffPerformanceService.getPerformance(BigInt(req.user.id));
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get own wallet balance and transactions' })
  getMyWallet(@Request() req: any) {
    return this.staffPerformanceService.getWallet(BigInt(req.user.id));
  }

  @Get(':id/performance')
  @UseGuards(RolesGuard)
  @Roles('admin', 'company_admin')
  @ApiOperation({
    summary: 'Get performance metrics for a specific staff member',
  })
  getStaffPerformance(@Param('id') id: string) {
    return this.staffPerformanceService.getPerformance(BigInt(id));
  }

  @Get(':id/availability')
  @UseGuards(RolesGuard)
  @Roles('admin', 'company_admin')
  @ApiOperation({
    summary:
      'Get availability/time-off for a specific staff member (company owner only)',
  })
  getStaffAvailability(@Request() req: any, @Param('id') id: string) {
    // req.user has the company owner's ID
    const companyId = req.user.companyId || req.user.id;
    // Wait, req.user might not have companyId readily available.
    // staffPerformanceService.getStaffAvailabilityForCompany can fetch the company using req.user.id
    // But let's look at getPerformance. It doesn't check companyId, just admin roles.
    // I'll just rely on the service to do the check or just use getAvailability directly if we trust the role.
    // Actually, getStaffAvailabilityForCompany requires companyId. Let's look up their company in the controller or pass userId.
    return this.staffPerformanceService.getStaffAvailabilityForCompany(
      BigInt(req.user.id),
      id,
    );
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get own reviews' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMyReviews(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.staffPerformanceService.getStaffReviews(
      BigInt(req.user.id),
      +page,
      +limit,
    );
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get own availability slots' })
  getMyAvailability(@Request() req: any) {
    return this.staffPerformanceService.getAvailability(BigInt(req.user.id));
  }

  @Put('availability')
  @ApiOperation({ summary: 'Update own availability slots' })
  updateMyAvailability(@Request() req: any, @Body() body: { slots: any[] }) {
    return this.staffPerformanceService.updateAvailability(
      BigInt(req.user.id),
      body.slots,
    );
  }
}
