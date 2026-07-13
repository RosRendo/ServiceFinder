import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('khqr')
  @ApiOperation({ summary: 'Handle incoming KHQR payment status webhook' })
  async handleKhqrPayment(@Body() payload: any) {
    return this.webhooksService.handleKhqrPayment(payload);
  }
}
