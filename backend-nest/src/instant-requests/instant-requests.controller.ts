import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InstantRequestsService } from './instant-requests.service';
import { CreateInstantRequestDto } from './dto/create-instant-request.dto';
import { CreateInstantRequestBidDto } from './dto/create-instant-request-bid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Instant Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('instant-requests')
export class InstantRequestsController {
  constructor(
    private readonly instantRequestsService: InstantRequestsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Customer creates an on-demand Instant Request' })
  create(@Body() dto: CreateInstantRequestDto, @CurrentUser() user: any) {
    return this.instantRequestsService.create(BigInt(user.id), dto);
  }

  @Get('company-feed')
  @ApiOperation({ summary: 'Company fetches open instant requests in their service area' })
  getCompanyFeed(@CurrentUser() user: any) {
    return this.instantRequestsService.getCompanyFeed(BigInt(user.id));
  }

  @Post(':id/bid')
  @ApiOperation({ summary: 'Company places a price/ETA bid on a request' })
  async submitBid(
    @Param('id') id: string,
    @Body() dto: CreateInstantRequestBidDto,
    @CurrentUser() user: any,
  ) {
    const companyId = await this.instantRequestsService.resolveCompanyId(
      BigInt(user.id),
    );
    return this.instantRequestsService.submitBid(
      companyId,
      BigInt(id),
      dto,
    );
  }

  @Get(':id/bids')
  @ApiOperation({ summary: 'Get current bids submitted for a request' })
  getRequestBids(@Param('id') id: string) {
    return this.instantRequestsService.getRequestBids(BigInt(id));
  }

  @Post(':id/select')
  @ApiOperation({ summary: 'Customer accepts a specific company bid' })
  selectBid(
    @Param('id') id: string,
    @Body() payload: { bidId: string },
    @CurrentUser() user: any,
  ) {
    return this.instantRequestsService.selectBid(
      BigInt(user.id),
      BigInt(id),
      BigInt(payload.bidId),
    );
  }
}
