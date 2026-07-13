// @ts-nocheck
import {
  Controller, Get, Post, Put,
  Body, Param, Query, Headers, Req,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto, UpdatePaymentDto,
  CheckoutSessionDto, CompletePaymentDto,
  ConfirmCashDto, PaypalOrderDto, CapturePaypalDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RawBodyRequest } from '@nestjs/common';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // â”€â”€â”€ Public Webhook (no auth) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe Webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody as Buffer, signature);
  }

  // â”€â”€â”€ Authenticated Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Return all payments.' })
  getAllPayments(@Query() query: any, @Request() req) {
    return this.paymentsService.getAllPayments(query, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Return payment details.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  getPaymentById(@Param('id') id: string, @Request() req) {
    return this.paymentsService.getPaymentById(BigInt(id), req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payment record' })
  @ApiResponse({ status: 201, description: 'The payment has been successfully created.' })
  createPayment(@Body() dto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.createPayment(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'The payment has been successfully updated.' })
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.updatePayment(BigInt(id), dto);
  }

  // â”€â”€â”€ Stripe Checkout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @UseGuards(JwtAuthGuard)
  @Post('stripe/checkout-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session' })
  @ApiResponse({ status: 201, description: 'Session created successfully.' })
  createCheckoutSession(@Body() dto: CheckoutSessionDto, @Request() req) {
    return this.paymentsService.createCheckoutSession(dto, req.user);
  }

  // â”€â”€â”€ Cash / Alt Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @UseGuards(JwtAuthGuard)
  @Post('complete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete a non-gateway payment (e.g., cash request)' })
  @ApiResponse({ status: 200, description: 'Payment successfully completed or set to pending verification.' })
  completePayment(@Body() dto: CompletePaymentDto, @Request() req) {
    return this.paymentsService.completePayment(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'company_admin', 'staff')
  @Post('cash/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm cash receipt (Staff/Admin only)' })
  @ApiResponse({ status: 200, description: 'Cash payment confirmed.' })
  confirmCashReceived(@Body() dto: ConfirmCashDto, @Request() req) {
    return this.paymentsService.confirmCashReceived(dto, req.user);
  }

  // â”€â”€â”€ PayPal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @UseGuards(JwtAuthGuard)
  @Post('paypal/create-order')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create PayPal Order' })
  @ApiResponse({ status: 201, description: 'PayPal order created successfully.' })
  createPaypalOrder(@Body() dto: PaypalOrderDto, @Request() req) {
    return this.paymentsService.createPaypalOrder(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('paypal/capture-order')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Capture PayPal Order' })
  @ApiResponse({ status: 200, description: 'PayPal order captured successfully.' })
  capturePaypalOrder(@Body() dto: CapturePaypalDto, @Request() req) {
    return this.paymentsService.capturePaypalOrder(dto, req.user);
  }
}

