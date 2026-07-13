import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';
import {
  CreateDisputeDto,
  RespondToDisputeDto,
  ResolveDisputeDto,
} from './dto/dispute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Disputes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  // Customer files a dispute on a booking
  @Post('bookings/:id/dispute')
  @ApiOperation({ summary: 'File a dispute for a booking' })
  fileDispute(
    @Param('id') id: string,
    @Body() dto: CreateDisputeDto,
    @Request() req: any,
  ) {
    return this.disputesService.fileDispute(
      BigInt(id),
      BigInt(req.user.id),
      dto,
    );
  }

  // Get disputes (role-scoped)
  @Get('disputes')
  @ApiOperation({ summary: 'Get disputes (role-scoped)' })
  getDisputes(@Request() req: any) {
    const companyId = req.user.companyId
      ? BigInt(req.user.companyId)
      : undefined;
    return this.disputesService.getDisputes(
      req.user.role,
      BigInt(req.user.id),
      companyId,
    );
  }

  // Get single dispute
  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get dispute by ID' })
  getDispute(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.disputesService.getDisputeById(
      id,
      BigInt(req.user.id),
      req.user.role,
    );
  }

  // Company responds to a dispute
  @Post('company/disputes/:id/response')
  @UseGuards(RolesGuard)
  @Roles('company_admin')
  @ApiOperation({ summary: 'Company responds to a dispute' })
  respondToDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespondToDisputeDto,
    @Request() req: any,
  ) {
    return this.disputesService.respondToDispute(
      id,
      BigInt(req.user.companyId),
      dto,
    );
  }

  // Admin resolves a dispute
  @Put('admin/disputes/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin resolves a dispute' })
  resolveDispute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolveDispute(id, dto);
  }
}
