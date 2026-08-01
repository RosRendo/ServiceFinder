import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @Roles('admin', 'company_admin')
  @ApiOperation({ summary: 'Get all support tickets, optionally filtered by status' })
  getTickets(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getTickets(status, Number(page) || 1, Number(limit) || 20);
  }

  @Patch('tickets/:id')
  @Roles('admin', 'company_admin')
  @ApiOperation({ summary: 'Update support ticket status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.supportService.updateTicketStatus(Number(id), body.status);
  }

  @Post('tickets/:id/reply')
  @Roles('admin', 'company_admin')
  @ApiOperation({ summary: 'Reply to a support ticket' })
  reply(@Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.replyToTicket(Number(id), body.message);
  }
}
