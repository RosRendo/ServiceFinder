import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @Roles('admin', 'company_admin', 'customer')
  @ApiOperation({ summary: 'Get support tickets' })
  getTickets(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    const filterUserId = user.role !== 'admin' ? BigInt(user.id) : undefined;
    return this.supportService.getTickets(
      status,
      Number(page) || 1,
      Number(limit) || 20,
      filterUserId,
    );
  }

  @Post('tickets')
  @Roles('admin', 'company_admin', 'customer')
  @ApiOperation({ summary: 'Create a support ticket' })
  createTicket(
    @Body() body: { subject: string; message: string; priority?: string },
    @CurrentUser() user: any,
  ) {
    return this.supportService.createTicket(
      BigInt(user.id),
      body.subject,
      body.message,
      body.priority,
    );
  }

  @Patch('tickets/:id')
  @Roles('admin', 'company_admin', 'customer')
  @ApiOperation({ summary: 'Update support ticket status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @CurrentUser() user: any,
  ) {
    return this.supportService.updateTicketStatus(
      Number(id),
      body.status,
      BigInt(user.id),
      user.role,
    );
  }

  @Post('tickets/:id/reply')
  @Roles('admin', 'company_admin', 'customer')
  @ApiOperation({ summary: 'Reply to a support ticket' })
  reply(
    @Param('id') id: string,
    @Body() body: { message: string },
    @CurrentUser() user: any,
  ) {
    return this.supportService.replyToTicket(
      Number(id),
      body.message,
      BigInt(user.id),
      user.fullName,
      user.role,
    );
  }
}

