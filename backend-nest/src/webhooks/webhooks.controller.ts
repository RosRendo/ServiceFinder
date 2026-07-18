import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('khqr')
  @ApiOperation({ summary: 'Handle incoming KHQR payment status webhook' })
  async handleKhqrPayment(
    @Body() payload: any,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-khqr-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf-8') ?? JSON.stringify(payload);
    return this.webhooksService.handleKhqrPayment(payload, rawBody, signature);
  }
}
