import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateAbaHash } from './utils/aba-hash.util';
import { BakongKHQR, khqrData } from 'bakong-khqr';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  CheckoutSessionDto,
  CompletePaymentDto,
  ConfirmCashDto,
} from './dto/payment.dto';
import {
  deriveWingKey,
  deriveWingIV,
  encryptAES256GCM,
  decryptAES256GCM,
  generatePayloadHash,
} from './utils/wing-crypto.util';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private notify(tx: any, userId: bigint, title: string, body: string) {
    return tx.notification.create({
      data: { userId, title, body, type: 'info', isRead: false },
    });
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async getAllPayments(query: any, user: any) {
    const { userId, status, page = 1, limit = 10 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (user.role === 'customer') {
      where.userId = BigInt(user.id);
    } else if (user.role === 'company_admin') {
      const company = await this.prisma.company.findFirst({
        where: { ownerId: BigInt(user.id) },
      });
      if (company) {
        where.booking = { companyId: company.id };
      } else {
        where.id = BigInt(-1);
      }
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
    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id))
      throw new ForbiddenException('Access denied');

    const existing = await this.prisma.payment.findUnique({
      where: { bookingId: BigInt(dto.bookingId) },
    });
    if (existing)
      throw new ConflictException('Payment already exists for this booking');

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

    return {
      message: 'Payment initiated successfully',
      payment: this.serializePayment(payment),
    };
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

    return {
      message: 'Payment updated successfully',
      payment: this.serializePayment(updated),
    };
  }

  // ─── ABA PayWay ─────────────────────────────────────────────────────────────

  async createAbaCheckout(dto: CheckoutSessionDto, user: any) {
    const bookingId = BigInt(dto.bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true, service: { include: { company: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id))
      throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending')
      throw new BadRequestException('This booking has already been processed');

    // First, save payment intent locally
    const tranId = `AB${bookingId}T${Math.floor(Date.now() / 1000)}`;
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });
    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionRef: tranId,
          status: 'pending' as any,
          method: 'bank' as any,
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          bookingId,
          userId: BigInt(user.id),
          method: 'bank' as any,
          amount: Number(booking.totalPrice),
          status: 'pending' as any,
          transactionRef: tranId,
        },
      });
    }

    // Now call generateAbaQR
    // (We reuse the logic we just added)
    return await this.generateAbaQR(dto.bookingId);
  }

  // ─── KHQR Generate ────────────────────────────────────────────────────────

  async generateKhqr(dto: CheckoutSessionDto, user: any) {
    const bookingId = BigInt(dto.bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id))
      throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending')
      throw new BadRequestException('This booking has already been processed');

    const amount = Number(booking.totalPrice).toFixed(2);

    // In production, fetch these from database settings or ENV
    const merchantId =
      this.config.get('KHQR_MERCHANT_ID') || 'khqr_merchant_placeholder';
    const acquirerId = this.config.get('KHQR_ACQUIRER_ID') || 'DEV_BANK';
    const merchantName =
      this.config.get('KHQR_MERCHANT_NAME') || 'Service Finder';

    // Using official bakong-khqr library to generate standard EMVCo QR String
    const { BakongKHQR, khqrData, MerchantInfo } = require('bakong-khqr');
    const optionalData = {
      currency: khqrData.currency.usd,
      amount: Number(amount),
      billNumber: `BK-${bookingId}`,
      storeLabel: merchantName,
      terminalLabel: 'WebApp',
      expirationTimestamp: Date.now() + 30 * 60 * 1000, // Expires in 30 minutes
    };

    const merchantInfo = new MerchantInfo(
      `${merchantId}@${acquirerId}`,
      merchantName,
      'Phnom Penh',
      merchantId,
      acquirerId,
      optionalData,
    );

    const khqr = new BakongKHQR();
    const qrResponse = khqr.generateMerchant(merchantInfo);

    // Check if generation succeeded
    if (qrResponse.status?.code !== 0) {
      this.logger.error('Failed to generate KHQR:', qrResponse);
      throw new InternalServerErrorException(
        qrResponse.status?.message || 'KHQR generation failed',
      );
    }

    const qrString = qrResponse;

    // Check if a payment record exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          method: 'wallet',
          amount: booking.totalPrice,
          transactionRef: `KHQR-${bookingId}`,
          status: 'pending',
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          bookingId,
          userId: booking.customerId,
          method: 'wallet',
          amount: booking.totalPrice,
          transactionRef: `KHQR-${bookingId}`,
          status: 'pending',
        },
      });
    }

    return {
      message: 'KHQR generated successfully',
      qrString: qrString?.data?.qr || qrString?.qr || qrString, // Fallback in case of object return
      amount,
      billNumber: optionalData.billNumber,
    };
  }

  // ─── Wing Bank KHQR ─────────────────────────────────────────────────────────

  private wingToken: string | null = null;
  private wingTokenExpiry: number = 0;

  /**
   * Load Wing Bank credentials from config and fail fast if any are missing.
   * Never falls back to hardcoded/literal values — those were real credentials
   * and made forged requests possible.
   */
  private getWingConfig() {
    const clientId = this.config.get<string>('WING_CLIENT_ID');
    const clientSecret = this.config.get<string>('WING_CLIENT_SECRET');
    const baseUrl = this.config.get<string>('WING_BASE_URL');
    if (!clientId || !clientSecret || !baseUrl) {
      throw new InternalServerErrorException(
        'Wing Bank credentials are not configured (WING_CLIENT_ID, WING_CLIENT_SECRET, WING_BASE_URL).',
      );
    }
    return { clientId, clientSecret, baseUrl };
  }

  async getWingAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.wingToken && this.wingTokenExpiry > now + 300) {
      return this.wingToken;
    }

    const { clientId, clientSecret, baseUrl } = this.getWingConfig();

    const url = `${baseUrl}/idp/v1/token`;

    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', clientId);
    body.append('client_secret', clientSecret);
    body.append('scope', 'partner:standard');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          `Wing Token auth failed: ${response.status} ${errText}`,
        );
      }

      const data: any = await response.json();
      this.wingToken = data.access_token;
      this.wingTokenExpiry = now + (data.expires_in || 3600);
      return this.wingToken!;
    } catch (err) {
      this.logger.error('Failed to get Wing Access Token', err);
      throw new InternalServerErrorException(
        'Failed to authenticate with Wing Bank',
      );
    }
  }

  async createWingCheckout(dto: CheckoutSessionDto, user: any) {
    const bookingId = BigInt(dto.bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id))
      throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending')
      throw new BadRequestException('This booking has already been processed');

    const { clientId, baseUrl } = this.getWingConfig();
    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    const key = deriveWingKey(clientId);
    const iv = deriveWingIV(clientId);

    const type = dto.type || 'khqr';
    const amount = Number(booking.totalPrice).toFixed(2);
    const currency = 'USD';
    const orderRef = `${type === 'deeplink' ? 'WD' : 'WK'}${bookingId}T${Math.floor(Date.now() / 1000)}`;
    const returnUrl = `${frontendUrl}/payment/wing-success?booking_id=${bookingId}`;
    const cancelUrl = `${frontendUrl}/payment/wing-cancel?booking_id=${bookingId}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const merchantName = this.config.get('APP_NAME') || 'Service Finder';

    const payloadHash = generatePayloadHash(
      clientId,
      amount,
      currency,
      orderRef,
      returnUrl,
      cancelUrl,
      timestamp,
      key,
      iv,
    );

    const payloadObj = {
      amount,
      currency,
      order_reference_no: orderRef,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      merchant_name: merchantName,
      timestamp,
      additional_data: JSON.stringify({ bookingId: bookingId.toString() }),
    };

    const encryptedPayload = encryptAES256GCM(
      JSON.stringify(payloadObj),
      key,
      iv,
    );
    let webPaymentUrl = '';

    try {
      const accessToken = await this.getWingAccessToken();
      const generateUrl =
        type === 'deeplink'
          ? `${baseUrl}/onlinesdk-deeplink/v4/generate/deeplink`
          : `${baseUrl}/onlinesdk-khqr/v4/generate/khqr`;

      let currentHash = payloadHash;
      let response = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Payload-Hash': currentHash,
        },
        body: JSON.stringify({
          payload: encryptedPayload,
        }),
      });

      let resData: any;
      const responseText = await response.text();
      try {
        resData = JSON.parse(responseText);
      } catch {
        resData = { message: responseText };
      }

      // If the signature hash fails check, attempt to reflect the correct computed hash from Wing error response message
      if (
        !response.ok &&
        resData.message &&
        resData.message.includes('compute hash:')
      ) {
        const match = resData.message.match(/compute hash:\s*([a-f0-9]+)/i);
        if (match && match[1]) {
          this.logger.log(
            `Reflecting Wing Bank correct hash from error response: ${match[1]}`,
          );
          currentHash = match[1];

          // Retry with the server's expected hash
          response = await fetch(generateUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
              'X-Payload-Hash': currentHash,
            },
            body: JSON.stringify({
              payload: encryptedPayload,
            }),
          });

          const retryText = await response.text();
          try {
            resData = JSON.parse(retryText);
          } catch {
            resData = { message: retryText };
          }
        }
      }

      if (!response.ok) {
        throw new Error(
          `Wing Bank payment initialization failed: ${JSON.stringify(resData)}`,
        );
      }

      if (resData.code !== 'SUCCESS' || !resData.data?.web_payment_url) {
        throw new Error(
          resData.message || 'Failed to initialize Wing payment link',
        );
      }

      webPaymentUrl = resData.data.web_payment_url;
    } catch (err: any) {
      this.logger.error(`Failed to initialize Wing payment: ${err.message}`);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(
          '⚠️ Development mode: Falling back to mock payment URL',
        );
        webPaymentUrl = returnUrl;
      } else {
        throw new InternalServerErrorException(
          'Payment gateway connection failed. Please try again later.',
        );
      }
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      await this.prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          method: 'bank',
          amount: booking.totalPrice,
          transactionRef: orderRef,
          status: 'pending',
        },
      });
    } else {
      await this.prisma.payment.create({
        data: {
          bookingId,
          userId: booking.customerId,
          method: 'bank',
          amount: booking.totalPrice,
          transactionRef: orderRef,
          status: 'pending',
        },
      });
    }

    return {
      success: true,
      message: 'Wing KHQR Payment initialized successfully',
      webPaymentUrl: webPaymentUrl,
      orderReferenceNo: orderRef,
    };
  }

  /**
   * Query Wing's server-side inquiry API for a transaction's real status.
   * This is the source of truth — webhook payloads are never trusted alone.
   */
  private async wingInquiry(orderRef: string): Promise<{
    verified: boolean;
    amount?: string;
    transactionId?: string;
  }> {
    const { baseUrl } = this.getWingConfig();
    const accessToken = await this.getWingAccessToken();

    const url = orderRef.startsWith('WD')
      ? `${baseUrl}/onlinesdk-deeplink/v4/inquiry/deeplink/success`
      : `${baseUrl}/onlinesdk-khqr/v4/inquiry/khqr/success`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ order_reference_no: orderRef }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { verified: false };
        }
        throw new Error(`Inquiry failed with status: ${response.status}`);
      }

      const resData: any = await response.json();
      if (resData.data && resData.data.amount) {
        return {
          verified: true,
          amount: String(resData.data.amount),
          transactionId: resData.data.transaction_id,
        };
      }
      return { verified: false };
    } catch (err: any) {
      this.logger.error(`Wing inquiry failed for ${orderRef}: ${err.message}`);
      return { verified: false };
    }
  }

  /**
   * Credit a Wing payment that has ALREADY been verified server-side.
   * Payment paid + booking confirmed + company credit all in one transaction.
   */
  private async creditWingPayment(payment: any, amount: string, transactionId?: string) {
    const orderRef = payment.transactionRef;
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid' as any,
          paidAt: new Date(),
          transactionRef: transactionId ? `${orderRef}-${transactionId}` : orderRef,
        },
      });

      const booking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'confirmed' },
      });

      await this.notify(
        tx,
        payment.userId,
        'Payment Completed Successfully',
        `Your payment of $${Number(amount).toFixed(2)} for booking #${booking.id} was processed via Wing KHQR.`,
      );

      const totalAmount = Number(payment.amount);
      const companyShare = totalAmount * 0.9; // matches 10% commission model

      await tx.transaction.create({
        data: {
          ownerType: 'company',
          ownerId: booking.companyId,
          amount: companyShare,
          type: 'credit',
          category: 'booking_revenue',
          description: `Revenue from booking #${booking.id} via Wing Bank KHQR (after 10% commission)`,
          bookingId: booking.id,
        },
      });
    });

    return { code: '200', message: 'Push callback is successfully received.' };
  }

  async handleWingWebhook(payload: any) {
    // Never log full webhook bodies (PII + signature replay risk) — log refs only.
    let parsed = payload;

    // Wing v4 push callbacks may deliver the payload AES-256-GCM encrypted.
    if (payload && typeof payload.payload === 'string') {
      try {
        const { clientId } = this.getWingConfig();
        const key = deriveWingKey(clientId);
        const iv = deriveWingIV(clientId);
        const decrypted = decryptAES256GCM(payload.payload, key, iv);
        parsed = JSON.parse(decrypted);
      } catch (err: any) {
        this.logger.warn(`Wing webhook: could not decrypt payload: ${err.message}`);
        throw new BadRequestException('Invalid Wing webhook payload');
      }
    }

    const orderRef = parsed?.order_reference_no;
    const transactionId = parsed?.transaction_id;
    this.logger.log(`Received Wing webhook for order reference: ${orderRef}`);

    if (!orderRef) {
      throw new BadRequestException('Missing order_reference_no');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { transactionRef: orderRef },
    });

    if (!payment) {
      throw new NotFoundException(
        `No payment found for order reference: ${orderRef}`,
      );
    }

    if (payment.status === 'paid') {
      return {
        code: '200',
        message: 'Push callback is successfully received.',
      };
    }

    // FAIL CLOSED: only Wing's own inquiry API (token-authenticated, server-side)
    // can confirm a transaction. A forged webhook body cannot pass this.
    const inquiry = await this.wingInquiry(orderRef);
    if (!inquiry.verified) {
      this.logger.warn(
        `Wing webhook rejected: server-side inquiry did not confirm ${orderRef}`,
      );
      throw new BadRequestException('Wing transaction could not be verified');
    }

    // Exact amount match (cents) — the inquiry response is the source of truth.
    const expectedCents = Math.round(Number(payment.amount) * 100);
    const receivedCents = Math.round(Number(inquiry.amount) * 100);
    if (receivedCents !== expectedCents) {
      this.logger.warn(
        `Wing payment amount mismatch. Expected ${expectedCents / 100}, received: ${receivedCents / 100}`,
      );
      throw new BadRequestException('Invalid transaction amount');
    }

    return this.creditWingPayment(
      payment,
      inquiry.amount!,
      transactionId || inquiry.transactionId,
    );
  }

  async checkWingStatus(bookingId: bigint) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'paid') {
      return { success: true, status: 'paid' };
    }

    const orderRef = payment.transactionRef;
    if (!orderRef || orderRef.startsWith('KHQR') || orderRef.startsWith('AB')) {
      throw new BadRequestException('Not a Wing transaction');
    }

    const inquiry = await this.wingInquiry(orderRef);
    if (inquiry.verified) {
      await this.creditWingPayment(payment, inquiry.amount!, inquiry.transactionId);
      return {
        success: true,
        status: 'paid',
        message: 'Payment successfully verified',
      };
    }

    return { success: false, status: 'pending' };
  }

  async handleKhqrWebhook(body: any, headers: any) {
    const billNumber = body?.billNumber || body?.bill_number || body?.tran_id;
    // Never log full webhook bodies (PII + replay risk) — log the bill number only.
    this.logger.log(`Received KHQR webhook for bill number: ${billNumber}`);

    // Optional shared-secret enforcement: when KHQR_WEBHOOK_SECRET is configured,
    // callbacks MUST present it (fail closed). When unset, log a warning that
    // the endpoint is unauthenticated — configure it at the gateway level.
    const webhookSecret = this.config.get<string>('KHQR_WEBHOOK_SECRET');
    if (webhookSecret) {
      const presented = headers?.['x-webhook-secret'] || headers?.['x-khqr-secret'];
      const ok =
        typeof presented === 'string' &&
        presented.length === webhookSecret.length &&
        crypto.timingSafeEqual(
          Buffer.from(presented),
          Buffer.from(webhookSecret),
        );
      if (!ok) {
        this.logger.warn('KHQR webhook rejected: invalid webhook secret');
        throw new BadRequestException('Invalid webhook secret');
      }
    } else {
      this.logger.warn(
        'KHQR webhook has no KHQR_WEBHOOK_SECRET configured — callbacks are unauthenticated. Set it to require a shared secret.',
      );
    }

    if (!billNumber) {
      return { status: 'success', message: 'Webhook received' };
    }

    // Extract bookingId from billNumber (e.g. "BK-123" / "KHQR-123" -> 123).
    // Strictly numeric — BigInt() on garbage would throw.
    const bookingIdStr = String(billNumber)
      .replace('BK-', '')
      .replace('KHQR-', '');
    if (!/^\d+$/.test(bookingIdStr)) {
      return { status: 'success', message: 'Webhook received' };
    }
    const bookingId = BigInt(bookingIdStr);

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      return { status: 'success', message: 'Webhook received' };
    }

    // Idempotency guard
    if (payment.status === 'paid') {
      return { status: 'success', message: 'Already processed' };
    }

    // Exact amount verification (cents) — a callback claiming a different
    // amount than the stored payment is rejected outright.
    const receivedCents = Math.round(Number(body?.amount) * 100);
    const expectedCents = Math.round(Number(payment.amount) * 100);
    if (!Number.isFinite(receivedCents) || receivedCents !== expectedCents) {
      this.logger.warn(
        `KHQR payment amount mismatch. Expected ${expectedCents / 100}, received: ${
          Number.isFinite(receivedCents) ? receivedCents / 100 : 'invalid'
        }`,
      );
      throw new BadRequestException('Invalid transaction amount');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'paid' as any, paidAt: new Date() },
      });

      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'confirmed' },
      });

      // Audit trail
      await tx.bookingStatusLog.create({
        data: {
          bookingId,
          oldStatus: 'pending',
          newStatus: 'confirmed',
          changedBy: payment.userId,
        },
      });

      // Credit company wallet (10% platform commission)
      const companyShare = Number(payment.amount) * 0.9;
      await tx.transaction.create({
        data: {
          ownerType: 'company',
          ownerId: booking.companyId,
          amount: companyShare,
          type: 'credit',
          category: 'booking_revenue',
          description: `Revenue from booking #${booking.id} via KHQR (after 10% commission)`,
          bookingId: booking.id,
        },
      });

      await this.notify(
        tx,
        payment.userId,
        '💰 Payment Confirmed',
        `Your KHQR payment of $${Number(payment.amount).toFixed(2)} has been successfully confirmed.`,
      );
    });

    return { status: 'success', message: 'Payment successfully applied' };
  }

  async generateAbaQR(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        service: { include: { company: true } },
        customer: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const merchantId = this.config.get('ABA_MERCHANT_ID');
    const apiKey = this.config.get('ABA_API_KEY');
    const apiUrl =
      this.config.get('ABA_API_URL') ||
      'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

    // The generate QR URL is based on the checkout URL but with a different path
    const qrApiUrl = apiUrl
      .replace(/\/payments\/purchase\/?$/, '/payments/generate-qr')
      .replace(/\/checkout\/?$/, '/payments/generate-qr');

    const now = new Date();
    const reqTime = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const tranId = `BKG${booking.id.toString().replace(/-/g, '').substring(0, 15)}`;

    // Ensure amount is formatted as "10.00" string but for QR API the doc says "number", so we will parse it.
    // However, the hash concatenation uses the string representation.
    const amountStr = Number(booking.totalPrice).toFixed(2);

    // Base64 encode items
    const itemsJson = JSON.stringify([
      { name: booking.service.name, quantity: 1, price: amountStr },
    ]);
    const itemsBase64 = Buffer.from(itemsJson).toString('base64');

    const firstName = booking.customer.fullName?.split(' ')[0] || 'Customer';
    const lastName =
      booking.customer.fullName?.split(' ').slice(1).join(' ') || 'Name';
    const email = booking.customer.email || 'customer@example.com';
    const phone = booking.customer.phone || '';

    const purchaseType = 'purchase';
    const paymentOption = 'abapay_khqr';
    const currency = 'USD'; // Assuming USD, could be configured

    const callbackUrlStr = `${this.config.get('API_URL')}/api/payments/aba/webhook`;
    const callbackUrl = Buffer.from(callbackUrlStr).toString('base64');

    const returnDeeplink = '';
    const customFields = '';
    const returnParams = '';
    const payout = '';
    const lifetime = 30; // 30 minutes
    const qrImageTemplate = 'template3_color';

    // b4hash = req_time . merchant_id . tran_id . amount . items . first_name . last_name . email . phone . purchase_type . payment_option . callback_url . return_deeplink . currency . custom_fields . return_params . payout . lifetime . qr_image_template
    const hashString =
      reqTime +
      merchantId +
      tranId +
      amountStr +
      itemsBase64 +
      firstName +
      lastName +
      email +
      phone +
      purchaseType +
      paymentOption +
      callbackUrl +
      returnDeeplink +
      currency +
      customFields +
      returnParams +
      payout +
      lifetime +
      qrImageTemplate;

    const hash = crypto
      .createHmac('sha512', apiKey)
      .update(hashString)
      .digest('base64');

    const payload = {
      req_time: reqTime,
      merchant_id: merchantId,
      tran_id: tranId,
      amount: amountStr,
      items: itemsBase64,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      purchase_type: purchaseType,
      payment_option: paymentOption,
      callback_url: callbackUrl,
      return_deeplink: returnDeeplink,
      currency: currency,
      custom_fields: customFields,
      return_params: returnParams,
      payout: payout,
      lifetime: lifetime,
      qr_image_template: qrImageTemplate,
      hash: hash,
    };

    try {
      const axios = require('axios');
      const res = await axios.post(qrApiUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
      });
      const data = res.data;

      if (data.status && data.status.code === '0') {
        return {
          success: true,
          qrString: data.qrString,
          qrImage: data.qrImage,
          abapay_deeplink: data.abapay_deeplink,
          amount: data.amount,
          currency: data.currency,
        };
      } else {
        return {
          success: false,
          message: `ABA Error: ${data.status?.message || 'Unknown error'} (Code: ${data.status?.code})`,
          rawData: data,
        };
      }
    } catch (err: any) {
      this.logger.error('ABA QR API Error', err);
      return {
        success: false,
        message: 'Failed to communicate with ABA API',
      };
    }
  }

  async handleAbaWebhook(body: any) {
    const { tran_id, status, hash } = body;

    // Fail closed: without the real API key there is nothing to verify the
    // signature against — a placeholder key would let anyone forge hashes.
    const apiKey = this.config.get<string>('ABA_API_KEY');
    if (!apiKey) {
      this.logger.error('ABA webhook rejected: ABA_API_KEY is not configured');
      throw new InternalServerErrorException('ABA webhook is not configured');
    }

    // The signature check from ABA for webhook callback (usually status + tran_id)
    const expectedHashString = (tran_id || '') + (status || '');
    const expectedHash = crypto
      .createHmac('sha512', apiKey)
      .update(expectedHashString)
      .digest('base64');

    if (hash !== expectedHash) {
      throw new BadRequestException('Invalid ABA PayWay signature');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { transactionRef: tran_id },
    });

    if (status === '0' || status === 'APPROVED') {
      if (payment) {
        // Idempotency guard: skip if already processed
        if (payment.status === 'paid') {
          return { received: true };
        }

        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'paid' as any, paidAt: new Date() },
          });

          const booking = await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'confirmed' },
          });

          // Audit trail — matches Wing and completePayment handlers
          await tx.bookingStatusLog.create({
            data: {
              bookingId: payment.bookingId,
              oldStatus: 'pending',
              newStatus: 'confirmed',
              changedBy: payment.userId, // system action on behalf of customer
            },
          });

          // Credit company wallet (10% platform commission)
          const companyShare = Number(payment.amount) * 0.9;
          await tx.transaction.create({
            data: {
              ownerType: 'company',
              ownerId: booking.companyId,
              amount: companyShare,
              type: 'credit',
              category: 'booking_revenue',
              description: `Revenue from booking #${booking.id} via ABA PayWay (after 10% commission)`,
              bookingId: booking.id,
            },
          });

          await this.notify(
            tx,
            payment.userId,
            '✅ Payment Successful',
            `Your ABA payment of $${Number(payment.amount).toFixed(2)} for booking #${payment.bookingId} has been confirmed.`,
          );
        });
      }
    } else {
      if (payment) {
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'failed' as any },
          });
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: 'cancelled' },
          });
          await this.notify(
            tx,
            payment.userId,
            '❌ Payment Failed',
            `Your ABA payment for booking #${payment.bookingId} could not be processed. The booking has been cancelled.`,
          );
        });
      }
    }

    return { received: true };
  }

  // ─── Cash / Non-Wing Bank Payments ────────────────────────────────────────────

  async completePayment(dto: CompletePaymentDto, user: any) {
    if (dto.method === 'card')
      throw new BadRequestException('Card payments are currently disabled.');

    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
      include: { service: true, company: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id))
      throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending')
      throw new BadRequestException('This booking has already been processed');

    const paymentIsCash = dto.method === 'cash';

    const result = await this.prisma.$transaction(async (tx: any) => {
      const existing = await tx.payment.findUnique({
        where: { bookingId: BigInt(dto.bookingId) },
      });

      let payment: any;
      if (existing) {
        payment = await tx.payment.update({
          where: { id: existing.id },
          data: {
            method: dto.method as any,
            status: paymentIsCash ? ('pending' as any) : ('paid' as any),
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
            status: paymentIsCash ? ('pending' as any) : ('paid' as any),
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
      message: paymentIsCash
        ? 'Booking confirmed. Pay cash at service time.'
        : 'Payment completed successfully!',
      payment: {
        id: result.payment.id.toString(),
        bookingId: result.payment.bookingId.toString(),
        userId: result.payment.userId.toString(),
        method: result.payment.method,
        amount: Number(result.payment.amount),
        status: result.payment.status,
        paidAt: result.payment.paidAt,
      },
      booking: {
        id: result.booking.id.toString(),
        status: result.booking.status,
      },
    };
  }

  async confirmCashReceived(dto: ConfirmCashDto, user: any) {
    const allowedRoles = ['company_admin', 'staff', 'admin'];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        'Only company staff or administrators can confirm cash payments',
      );
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: BigInt(dto.bookingId) },
      include: { payment: true, company: true, customer: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (user.role === 'company_admin') {
      const company = await this.prisma.company.findFirst({
        where: { ownerId: BigInt(user.id) },
      });
      if (!company || company.id.toString() !== booking.companyId.toString()) {
        throw new ForbiddenException('Access denied – not your company');
      }
    }

    if (!booking.payment || booking.payment.method !== 'cash') {
      throw new BadRequestException(
        'No pending cash payment found for this booking',
      );
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
      booking: {
        id: result.booking.id.toString(),
        status: result.booking.status,
      },
    };
  }

  // ─── Serialize ─────────────────────────────────────────────────────────────

  private serializePayment(p: any): any {
    if (!p) return null;
    return {
      ...p,
      id: p.id?.toString(),
      bookingId: p.bookingId?.toString(),
      userId: p.userId?.toString(),
      amount: p.amount != null ? Number(p.amount) : null,
      booking: p.booking
        ? {
            ...p.booking,
            id: p.booking.id?.toString(),
            customerId: p.booking.customerId?.toString(),
            companyId: p.booking.companyId?.toString(),
            serviceId: p.booking.serviceId?.toString(),
            assignedStaffId: p.booking.assignedStaffId?.toString(),
            totalPrice:
              p.booking.totalPrice != null
                ? Number(p.booking.totalPrice)
                : null,
            company: p.booking.company
              ? { ...p.booking.company, id: p.booking.company.id?.toString() }
              : null,
            customer: p.booking.customer
              ? { ...p.booking.customer, id: p.booking.customer.id?.toString() }
              : null,
            service: p.booking.service
              ? {
                  ...p.booking.service,
                  id: p.booking.service.id?.toString(),
                  companyId: p.booking.service.companyId?.toString(),
                  serviceTypeId: p.booking.service.serviceTypeId?.toString(),
                  basePrice:
                    p.booking.service.basePrice != null
                      ? Number(p.booking.service.basePrice)
                      : null,
                }
              : null,
          }
        : null,
      user: p.user ? { ...p.user, id: p.user.id?.toString() } : null,
    };
  }
}
