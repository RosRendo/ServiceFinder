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
      include: { customer: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId !== BigInt(user.id))
      throw new ForbiddenException('Access denied');
    if (booking.status !== 'pending')
      throw new BadRequestException('This booking has already been processed');

    const merchantId = this.config.get('ABA_MERCHANT_ID') || 'ecash';
    const apiKey = this.config.get('ABA_API_KEY') || 'aba_api_key_placeholder';
    const apiUrl =
      this.config.get('ABA_API_URL') ||
      'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';

    // ABA requires req_time to be YYYYMMDDHHMMSS
    const now = new Date();
    const reqTime = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    // ABA PayWay tran_id must be <= 20 chars and alphanumeric
    // "AB" + max 6 digit bookingId + "T" + 10 digit unix timestamp = max 19 chars
    const tranId = `AB${bookingId}T${Math.floor(Date.now() / 1000)}`;
    const amount = Number(booking.totalPrice).toFixed(2); // String formatting (e.g. "15.00")

    const params = {
      req_time: reqTime,
      merchant_id: merchantId,
      tran_id: tranId,
      amount: amount,
      firstname: booking.customer.fullName.split(' ')[0] || 'Customer',
      lastname: booking.customer.fullName.split(' ')[1] || 'Name',
      email: booking.customer.email || 'customer@servicefinder.local',
      phone: booking.customer.phone || '',
      type: 'purchase',
      payment_option: '', // Blank means user chooses on ABA screen
      return_url: Buffer.from(
        `${this.config.get('FRONTEND_URL') || 'http://localhost:3000'}/payment/aba-success?booking_id=${bookingId}`,
      ).toString('base64'),
    };

    const hash = generateAbaHash(params, apiKey);

    // Save payment intent locally
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

    // Build the form to submit to ABA WebView
    return {
      url: apiUrl,
      method: 'POST',
      body: {
        ...params,
        hash,
      },
    };
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

  async getWingAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.wingToken && this.wingTokenExpiry > now + 300) {
      return this.wingToken;
    }

    const clientId =
      this.config.get('WING_CLIENT_ID') || 'Nt1fvXDfJO9nLfwvEhHyBMG_Nh4a';
    const clientSecret =
      this.config.get('WING_CLIENT_SECRET') ||
      'h02F_zaRmn6PhFjIolbFcb16BgWGMrcfX93frd13Id8a';
    const baseUrl =
      this.config.get('WING_BASE_URL') ||
      'https://stage-partner-gateway.wingbank.com';

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

    const clientId =
      this.config.get('WING_CLIENT_ID') || 'Nt1fvXDfJO9nLfwvEhHyBMG_Nh4a';
    const cipherKeyStr =
      this.config.get('WING_CIPHER_KEY') ||
      'pEHt/rl63W4YZUqPRs92DPHHpHWfnkiMLvJdwhxQBb4=';
    const baseUrl =
      this.config.get('WING_BASE_URL') ||
      'https://stage-partner-gateway.wingbank.com';
    const frontendUrl =
      this.config.get('FRONTEND_URL') || 'http://localhost:3000';

    const key = deriveWingKey(clientId);
    const iv = deriveWingIV(clientId);

    const amount = Number(booking.totalPrice).toFixed(2);
    const currency = 'USD';
    const orderRef = `WK${bookingId}T${Math.floor(Date.now() / 1000)}`;
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
      const generateUrl = `${baseUrl}/generate/khqr`;

      const response = await fetch(generateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Payload-Hash': payloadHash,
        },
        body: JSON.stringify({
          payload: encryptedPayload,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Wing KHQR failed: ${response.status} ${errText}`);
      }

      const resData: any = await response.json();
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

  async handleWingWebhook(payload: any) {
    this.logger.log(`Received Wing Webhook: ${JSON.stringify(payload)}`);
    const orderRef = payload.order_reference_no;
    const amount = payload.amount;
    const transactionId = payload.transaction_id;

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

    const expectedAmount = Number(payment.amount);
    const receivedAmount = Number(amount);
    if (receivedAmount < expectedAmount) {
      this.logger.warn(
        `Wing payment amount mismatch. Expected >= ${expectedAmount}, received: ${receivedAmount}`,
      );
      throw new BadRequestException('Invalid transaction amount');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid' as any,
          paidAt: new Date(),
          transactionRef: `${orderRef}-${transactionId}`,
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
        `Your payment of $${receivedAmount} for booking #${booking.id} was processed via Wing KHQR.`,
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

    const clientId =
      this.config.get('WING_CLIENT_ID') || 'Nt1fvXDfJO9nLfwvEhHyBMG_Nh4a';
    const baseUrl =
      this.config.get('WING_BASE_URL') ||
      'https://stage-partner-gateway.wingbank.com';
    const accessToken = await this.getWingAccessToken();

    const url = `${baseUrl}/inquiry/khqr/success`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          order_reference_no: orderRef,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            status: 'pending',
            message: 'Payment pending or not found',
          };
        }
        throw new Error(`Inquiry failed with status: ${response.status}`);
      }

      const resData: any = await response.json();
      if (resData.data && resData.data.amount) {
        const amount = resData.data.amount;
        const transactionId = resData.data.transaction_id;

        await this.handleWingWebhook({
          order_reference_no: orderRef,
          amount,
          transaction_id: transactionId,
        });

        return {
          success: true,
          status: 'paid',
          message: 'Payment successfully verified',
        };
      }

      return { success: false, status: 'pending' };
    } catch (err: any) {
      this.logger.error('Failed to query Wing payment status', err);
      return { success: false, status: 'pending', error: err.message };
    }
  }

  async handleKhqrWebhook(body: any, headers: any) {
    this.logger.log(`Received KHQR Webhook: ${JSON.stringify(body)}`);

    const billNumber = body.billNumber || body.bill_number || body.tran_id;
    const amount = body.amount;

    if (billNumber) {
      // Extract bookingId from billNumber (e.g. "BK-123" -> 123)
      const bookingIdStr = billNumber.replace('BK-', '').replace('KHQR-', '');
      const bookingId = BigInt(bookingIdStr);

      const payment = await this.prisma.payment.findUnique({
        where: { bookingId },
      });

      if (payment) {
        await this.prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'paid' as any, paidAt: new Date() },
          });

          await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'confirmed' },
          });

          await this.notify(
            tx,
            payment.userId,
            '💰 Payment Confirmed',
            `Your KHQR payment of $${amount || Number(payment.amount).toFixed(2)} has been successfully confirmed.`,
          );
        });

        return { status: 'success', message: 'Payment successfully applied' };
      }
    }

    return { status: 'success', message: 'Webhook received' };
  }

  async handleAbaWebhook(body: any) {
    const { tran_id, status, hash, apv } = body;
    const apiKey = this.config.get('ABA_API_KEY') || 'aba_api_key_placeholder';

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
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'paid' as any, paidAt: new Date() },
        });
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'confirmed' },
        });
        await this.prisma.notification.create({
          data: {
            userId: payment.userId,
            title: 'Payment Successful',
            body: `Your ABA payment for booking #${payment.bookingId} has been confirmed.`,
            type: 'info',
            isRead: false,
          },
        });
      }
    } else {
      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'failed' as any },
        });
        await this.prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'cancelled' },
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
