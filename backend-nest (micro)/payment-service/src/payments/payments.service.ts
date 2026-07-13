// @ts-nocheck
import {
  Injectable, NotFoundException, ForbiddenException,
  ConflictException, BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentDto, UpdatePaymentDto,
  CheckoutSessionDto, CompletePaymentDto,
  ConfirmCashDto, PaypalOrderDto, CapturePaypalDto,
} from './dto/payment.dto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');

@Injectable()
export class PaymentsService {
  private stripe: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.config.get('STRIPE_SECRET_KEY') || 'sk_test_placeholder',
      { apiVersion: '2025-03-31.basil' },
    );
  }

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private notify(tx: any, userId: bigint, title: string, body: string) {
    return tx.notification.create({
      data: { userId, title, body, type: 'info', isRead: false },
    });
  }

  // â”€â”€â”€ CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getAllPayments(query: any, user: any) {
    const { userId, status, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role === 'customer') {
      where.userId = BigInt(user.id);
    } else if (userId) {
      where.userId = BigInt(userId);
    }
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          booking: {
            include: {
              service: { select: { name: true } },
              company: { select: { name: true } },
            },
          },
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p: any) => this.serializePayment(p)),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async getPaymentById(id: bigint, user: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            service: true,
            company: true,
            customer: { select: { id: true, fullName: true, email: true } },
          },
        },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (user.role === 'customer' && payment.userId !== BigInt(user.id)) {
      throw new ForbiddenException('Access denied');
    }

    return { payment: this.serializePayment(payment) };
  }

  async createPayment(dto: CreatePaymentDto, user: any) {
    const booking = await this.prisma.booking.findUnique({ where: { id: BigInt(dto.bookingId) } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id)) throw new ForbiddenException('Access denied');

    const existing = await this.prisma.payment.findUnique({ where: { bookingId: BigInt(dto.bookingId) } });
    if (existing) throw new ConflictException('Payment already exists for this booking');

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: BigInt(dto.bookingId),
        userId: BigInt(user.id),
        method: dto.method as any,
        amount: Number(booking.totalPrice),
        status: 'pending' as any,
        transactionRef: dto.transactionRef,
      },
      include: { booking: { include: { service: true, company: true } } },
    });

    return { message: 'Payment initiated successfully', payment: this.serializePayment(payment) };
  }

  async updatePayment(id: bigint, dto: UpdatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');

    const updateData: any = { status: dto.status as any };
    if (dto.transactionRef) updateData.transactionRef = dto.transactionRef;
    if (dto.status === 'paid') updateData.paidAt = new Date();

    const updated = await this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: { booking: { include: { service: true, company: true } } },
    });

    return { message: 'Payment updated successfully', payment: this.serializePayment(updated) };
  }

  // â”€â”€â”€ Stripe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async createCheckoutSession(dto: CheckoutSessionDto, user: any) {
    const bookingId = BigInt(dto.bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, company: true, customer: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id)) throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending') throw new BadRequestException('This booking has already been processed');

    const existingPayment = await this.prisma.payment.findUnique({ where: { bookingId } });
    if (existingPayment?.status === 'paid') throw new BadRequestException('Payment already completed for this booking');

    const serviceFeeInCents = Math.round(Number(booking.service.basePrice) * 100);
    const platformFeeInCents = Math.round(Number(booking.platformFee) * 100);
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.service.name,
              description: `Service by ${booking.company.name}`,
            },
            unit_amount: serviceFeeInCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Platform Fee', description: 'Service platform fee' },
            unit_amount: platformFeeInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/customer/bookings/${dto.bookingId}/payments/success?booking_id=${dto.bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancelled?booking_id=${dto.bookingId}&reason=cancelled`,
      customer_email: booking.customer.email,
      client_reference_id: dto.bookingId,
      metadata: {
        bookingId: dto.bookingId,
        userId: user.id.toString(),
        customerName: booking.customer.fullName,
      },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: { transactionRef: session.id, status: 'pending' as any, method: 'card' as any },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          bookingId,
          userId: BigInt(user.id),
          method: 'card' as any,
          amount: Number(booking.totalPrice),
          status: 'pending' as any,
          transactionRef: session.id,
        },
      });
    }

    return { sessionId: session.id, url: session.url };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const endpointSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await this.handleCheckoutSessionExpired(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;
      default:
        break;
    }

    return { received: true };
  }

  // â”€â”€â”€ Cash / Non-Stripe Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async completePayment(dto: CompletePaymentDto, user: any) {
    if (dto.method === 'card') throw new BadRequestException('Please use Stripe Checkout for card payments');

    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
      include: { service: true, company: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id)) throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending') throw new BadRequestException('This booking has already been processed');

    const paymentIsCash = dto.method === 'cash';

    const result = await this.prisma.$transaction(async (tx: any) => {
      const existing = await tx.payment.findUnique({ where: { bookingId: BigInt(dto.bookingId) } });

      let payment: any;
      if (existing) {
        payment = await tx.payment.update({
          where: { id: existing.id },
          data: {
            method: dto.method as any,
            status: paymentIsCash ? 'pending' as any : 'paid' as any,
            paidAt: paymentIsCash ? null : new Date(),
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            bookingId: BigInt(dto.bookingId),
            userId: BigInt(user.id),
            method: dto.method as any,
            amount: Number(booking.totalPrice),
            status: paymentIsCash ? 'pending' as any : 'paid' as any,
            paidAt: paymentIsCash ? null : new Date(),
          },
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id: BigInt(dto.bookingId) },
        data: { status: 'confirmed' },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: BigInt(dto.bookingId),
          oldStatus: 'pending',
          newStatus: 'confirmed',
          changedBy: BigInt(user.id),
        },
      });

      const title = paymentIsCash ? 'Booking Confirmed' : 'Payment Successful';
      const body = paymentIsCash
        ? `Your booking has been confirmed. Please pay $${booking.totalPrice} in cash at service time.`
        : `Your payment of $${booking.totalPrice} has been processed successfully.`;

      await this.notify(tx, BigInt(user.id), title, body);

      return { payment, booking: updatedBooking };
    });

    return {
      success: true,
      message: paymentIsCash ? 'Booking confirmed. Pay cash at service time.' : 'Payment completed successfully!',
      payment: {
        id: result.payment.id.toString(),
        bookingId: result.payment.bookingId.toString(),
        userId: result.payment.userId.toString(),
        method: result.payment.method,
        amount: Number(result.payment.amount),
        status: result.payment.status,
        paidAt: result.payment.paidAt,
      },
      booking: { id: result.booking.id.toString(), status: result.booking.status },
    };
  }

  async confirmCashReceived(dto: ConfirmCashDto, user: any) {
    const allowedRoles = ['company_admin', 'staff', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException('Only company staff or administrators can confirm cash payments');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
      include: { payment: true, company: true, customer: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role === 'company_admin') {
      const company = await this.prisma.company.findFirst({ where: { ownerId: BigInt(user.id) } });
      if (!company || company.id.toString() !== booking.companyId.toString()) {
        throw new ForbiddenException('Access denied â€“ not your company');
      }
    }

    if (!booking.payment || booking.payment.method !== 'cash') {
      throw new BadRequestException('No pending cash payment found for this booking');
    }
    if (booking.payment.status === 'paid') {
      throw new BadRequestException('Cash payment already confirmed');
    }

    const paymentRecord = booking.payment;

    const result = await this.prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: 'paid' as any,
          paidAt: new Date(),
          transactionRef: `CASH-${dto.bookingId}-${Date.now()}`,
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: BigInt(dto.bookingId) },
        data: {
          status: 'completed',
          actualEndTime: new Date(),
          ...(dto.staffNotes && { staffNotes: dto.staffNotes }),
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: BigInt(dto.bookingId),
          oldStatus: booking.status,
          newStatus: 'completed',
          changedBy: BigInt(user.id),
        },
      });

      await this.notify(
        tx,
        booking.customerId,
        'Cash Payment Confirmed',
        `Your cash payment of $${paymentRecord.amount} for booking #${dto.bookingId} has been confirmed by ${booking.company.name}.`,
      );

      await this.notify(
        tx,
        BigInt(user.id),
        'Cash Collected',
        `Cash of $${paymentRecord.amount} collected for booking #${dto.bookingId} from ${booking.customer.fullName}.`,
      );

      return { payment, booking: updatedBooking };
    });

    return {
      success: true,
      message: 'Cash payment confirmed. Booking marked as completed.',
      payment: {
        id: result.payment.id.toString(),
        status: result.payment.status,
        paidAt: result.payment.paidAt,
        transactionRef: result.payment.transactionRef,
      },
      booking: { id: result.booking.id.toString(), status: result.booking.status },
    };
  }

  // â”€â”€â”€ PayPal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async createPaypalOrder(dto: PaypalOrderDto, user: any) {
    let paypal: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      paypal = require('@paypal/checkout-server-sdk');
    } catch {
      throw new InternalServerErrorException('PayPal SDK not installed. Run: npm install @paypal/checkout-server-sdk');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
      include: { service: true, company: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id)) throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending') throw new BadRequestException('This booking has already been processed');

    const clientId = this.config.get('PAYPAL_CLIENT_ID') || 'PAYPAL-SANDBOX-CLIENT-ID';
    const clientSecret = this.config.get('PAYPAL_CLIENT_SECRET') || 'PAYPAL-SANDBOX-CLIENT-SECRET';
    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const paypalClient = new paypal.core.PayPalHttpClient(environment);
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:3000';
    const totalAmount = Number(booking.totalPrice).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: dto.bookingId,
        description: `Booking #${dto.bookingId} - ${booking.service.name}`,
        amount: { currency_code: 'USD', value: totalAmount },
      }],
      application_context: {
        return_url: `${frontendUrl}/customer/bookings/${dto.bookingId}/payments/success?method=paypal&booking_id=${dto.bookingId}`,
        cancel_url: `${frontendUrl}/payment/cancelled?booking_id=${dto.bookingId}&reason=cancelled`,
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    });

    const response = await paypalClient.execute(request);
    const orderID = response.result.id;
    const approveLink = response.result.links.find((l: any) => l.rel === 'approve');
    if (!approveLink) throw new InternalServerErrorException('Could not find PayPal approve link');

    const existing = await this.prisma.payment.findUnique({ where: { bookingId: BigInt(dto.bookingId) } });
    if (existing) {
      await this.prisma.payment.update({ where: { id: existing.id }, data: { transactionRef: orderID, status: 'pending' as any, method: 'paypal' as any } });
    } else {
      await this.prisma.payment.create({
        data: { bookingId: BigInt(dto.bookingId), userId: BigInt(user.id), method: 'paypal' as any, amount: Number(booking.totalPrice), status: 'pending' as any, transactionRef: orderID },
      });
    }

    return { success: true, orderId: orderID, url: approveLink.href };
  }

  async capturePaypalOrder(dto: CapturePaypalDto, user: any) {
    let paypal: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      paypal = require('@paypal/checkout-server-sdk');
    } catch {
      throw new InternalServerErrorException('PayPal SDK not installed. Run: npm install @paypal/checkout-server-sdk');
    }

    const clientId = this.config.get('PAYPAL_CLIENT_ID') || 'PAYPAL-SANDBOX-CLIENT-ID';
    const clientSecret = this.config.get('PAYPAL_CLIENT_SECRET') || 'PAYPAL-SANDBOX-CLIENT-SECRET';
    const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
    const paypalClient = new paypal.core.PayPalHttpClient(environment);

    const request = new paypal.orders.OrdersCaptureRequest(dto.orderID);
    request.requestBody({});
    const response = await paypalClient.execute(request);

    if (response.result.status !== 'COMPLETED') {
      throw new BadRequestException('Payment was not completed');
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      const existing = await tx.payment.findFirst({ where: { transactionRef: dto.orderID } });
      let payment: any;
      if (existing) {
        payment = await tx.payment.update({ where: { id: existing.id }, data: { status: 'paid' as any, paidAt: new Date() } });
      } else {
        payment = await tx.payment.create({
          data: {
            bookingId: BigInt(dto.bookingId), userId: BigInt(user.id), method: 'paypal' as any,
            amount: Number(response.result.purchase_units[0].amount.value),
            status: 'paid' as any, transactionRef: dto.orderID, paidAt: new Date(),
          },
        });
      }

      const updatedBooking = await tx.booking.update({ where: { id: BigInt(dto.bookingId) }, data: { status: 'confirmed' } });

      await tx.bookingStatusLog.create({
        data: { bookingId: BigInt(dto.bookingId), oldStatus: 'pending', newStatus: 'confirmed', changedBy: BigInt(user.id) },
      });

      await this.notify(tx, BigInt(user.id), 'PayPal Payment Successful', 'Your PayPal payment has been processed completely.');

      return { payment, booking: updatedBooking };
    });

    return {
      success: true,
      message: 'PayPal payment captured successfully!',
      payment: { id: result.payment.id.toString(), bookingId: result.payment.bookingId.toString(), status: result.payment.status },
    };
  }

  // â”€â”€â”€ Private Stripe Webhook Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async handleCheckoutSessionCompleted(session: any) {
    const bookingId = BigInt(session.metadata?.bookingId ?? '0');
    const userId = BigInt(session.metadata?.userId ?? '0');

    const payment = await this.prisma.payment.findFirst({ where: { bookingId, transactionRef: session.id } });
    if (payment) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'paid' as any, paidAt: new Date() } });
    }

    await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'confirmed' } });
    await this.prisma.notification.create({
      data: { userId, title: 'Payment Successful', body: `Your payment for booking #${bookingId} has been confirmed.`, type: 'info', isRead: false },
    });
  }

  private async handleCheckoutSessionExpired(session: any) {
    const bookingId = BigInt(session.metadata?.bookingId ?? '0');
    const payment = await this.prisma.payment.findFirst({ where: { bookingId, transactionRef: session.id } });
    if (payment) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' as any } });
    }
    await this.prisma.booking.update({ where: { id: bookingId }, data: { status: 'cancelled' } });
  }

  private async handlePaymentIntentFailed(paymentIntent: any) {
    const payment = await this.prisma.payment.findFirst({ where: { transactionRef: paymentIntent.id } });
    if (payment) {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' as any } });
      await this.prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'cancelled' } });
    }
  }

  // â”€â”€â”€ Serialize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private serializePayment(p: any): any {
    if (!p) return null;
    return {
      ...p,
      id: p.id?.toString(),
      bookingId: p.bookingId?.toString(),
      userId: p.userId?.toString(),
      amount: p.amount != null ? Number(p.amount) : null,
      booking: p.booking ? {
        ...p.booking,
        id: p.booking.id?.toString(),
        customerId: p.booking.customerId?.toString(),
        companyId: p.booking.companyId?.toString(),
        serviceId: p.booking.serviceId?.toString(),
        assignedStaffId: p.booking.assignedStaffId?.toString(),
        totalPrice: p.booking.totalPrice != null ? Number(p.booking.totalPrice) : null,
        company: p.booking.company ? { ...p.booking.company, id: p.booking.company.id?.toString() } : null,
        customer: p.booking.customer ? { ...p.booking.customer, id: p.booking.customer.id?.toString() } : null,
        service: p.booking.service ? {
          ...p.booking.service,
          id: p.booking.service.id?.toString(),
          companyId: p.booking.service.companyId?.toString(),
          serviceTypeId: p.booking.service.serviceTypeId?.toString(),
          basePrice: p.booking.service.basePrice != null ? Number(p.booking.service.basePrice) : null,
        } : null,
      } : null,
      user: p.user ? { ...p.user, id: p.user.id?.toString() } : null,
    };
  }
}

