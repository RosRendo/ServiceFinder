import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all compliance reports, optionally filtered by status' })
  getReports(@Query('status') status?: string) {
    return this.complianceService.getReports(status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a compliance report status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.complianceService.updateStatus(Number(id), body.status);
  }
}
