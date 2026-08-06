import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Headers,
  Req,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  CheckoutSessionDto,
  CompletePaymentDto,
  ConfirmCashDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RawBodyRequest } from '@nestjs/common';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Public Webhook (no auth) ───────────────────────────────────────────────

  @Post('webhook/aba')
  @ApiOperation({ summary: 'ABA PayWay Webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  handleAbaWebhook(@Body() body: any) {
    return this.paymentsService.handleAbaWebhook(body);
  }

  @Post('webhook/khqr')
  @ApiOperation({ summary: 'KHQR Webhook' })
  @ApiResponse({
    status: 200,
    description: 'KHQR webhook processed successfully.',
  })
  handleKhqrWebhook(@Body() body: any, @Headers() headers: any) {
    return this.paymentsService.handleKhqrWebhook(body, headers);
  }

  // ─── Authenticated Routes ───────────────────────────────────────────────────

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
  @ApiResponse({
    status: 201,
    description: 'The payment has been successfully created.',
  })
  createPayment(@Body() dto: CreatePaymentDto, @Request() req) {
    return this.paymentsService.createPayment(dto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a payment (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The payment has been successfully updated.',
  })
  updatePayment(@Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.updatePayment(BigInt(id), dto);
  }

  // ─── ABA PayWay ─────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('aba/checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ABA PayWay Checkout' })
  @ApiResponse({
    status: 201,
    description: 'ABA checkout generated successfully.',
  })
  createAbaCheckout(@Body() dto: CheckoutSessionDto, @Request() req) {
    return this.paymentsService.createAbaCheckout(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('khqr/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate KHQR for Booking' })
  @ApiResponse({
    status: 201,
    description: 'KHQR string generated successfully.',
  })
  generateKhqr(@Body() dto: CheckoutSessionDto, @Request() req) {
    return this.paymentsService.generateKhqr(dto, req.user);
  }

  // ─── Cash / Alt Payments ────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('complete')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete a non-gateway payment (e.g., cash request)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Payment successfully completed or set to pending verification.',
  })
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

  // ─── Wing Bank KHQR ─────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('wing/checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Wing Bank KHQR Checkout' })
  @ApiResponse({ status: 201, description: 'Wing checkout generated successfully.' })
  createWingCheckout(@Body() dto: CheckoutSessionDto, @Request() req) {
    return this.paymentsService.createWingCheckout(dto, req.user);
  }

  @Post('webhook/wing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wing Bank KHQR Webhook Callback' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  handleWingWebhook(@Body() body: any) {
    return this.paymentsService.handleWingWebhook(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/wing-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check status of Wing KHQR Payment' })
  @ApiResponse({ status: 200, description: 'Returns current payment status.' })
  checkWingStatus(@Param('id') id: string) {
    return this.paymentsService.checkWingStatus(BigInt(id));
  }
}
