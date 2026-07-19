import { Controller, Post, Body, Req, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('aba')
  @ApiOperation({ summary: 'Handle incoming ABA PayWay webhook' })
  async handleAbaWebhook(@Body() payload: any) {
    // ABA PayWay can send base64 encoded 'response' or direct JSON payload
    // In many cases with S2S, it sends formData or JSON.
    // We pass the parsed body straight to the service.
    return this.webhooksService.handleAbaPayment(payload);
  }

  // Alias just in case the frontend or old config is still hitting /khqr
  @Post('khqr')
  @ApiOperation({ summary: 'Alias for ABA webhook' })
  async handleKhqrAlias(@Body() payload: any) {
    return this.webhooksService.handleAbaPayment(payload);
  }
}
