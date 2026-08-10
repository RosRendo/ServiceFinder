import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async getCompanyByOwnerId(ownerId: bigint) {
    return this.prisma.company.findFirst({ where: { ownerId } });
  }

  async getPayouts(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { availableBalance: true, pendingBalance: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const payouts = await this.prisma.payout.findMany({
      where: { companyId },
      orderBy: { requestedAt: 'desc' },
    });

    return {
      payouts,
      availableBalance: Number(company.availableBalance),
      pendingBalance: Number(company.pendingBalance),
    };
  }

  async requestPayout(companyId: bigint, amount: number, method: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { availableBalance: true, pendingBalance: true },
    });
    if (!company) throw new NotFoundException('Company not found');

    const available = Number(company.availableBalance);

    if (amount > available) {
      throw new BadRequestException(
        `Insufficient balance. Available: $${available.toFixed(2)}`,
      );
    }

    const payout = await this.prisma.payout.create({
      data: {
        companyId,
        amount,
        method,
        status: 'pending',
        payoutType: 'company',
      },
    });

    return { message: 'Payout request submitted', payout };
  }

  // --- STAFF PAYOUTS ---

  async getStaffPayouts(staffId: bigint) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
    });

    if (!staff) throw new NotFoundException('Staff not found');

    const payouts = await this.prisma.payout.findMany({
      where: { staffId: staff.id },
      orderBy: { requestedAt: 'desc' },
    });

    const availableBalance = Number(staff.walletBalance);

    return { success: true, payouts, availableBalance };
  }

  async requestStaffPayout(staffId: bigint, amount: number, method: string) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    // Find staff member's company
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
    });

    if (!staff) throw new NotFoundException('Staff not found');

    const available = Number(staff.walletBalance);

    if (amount > available) {
      throw new BadRequestException(
        `Insufficient balance. Available: $${available.toFixed(2)}`,
      );
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payout.create({
        data: {
          staffId,
          amount,
          method,
          status: 'pending',
          payoutType: 'staff',
        },
      });

      await tx.companyStaff.update({
        where: { id: staffId },
        data: { walletBalance: { decrement: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          staffId,
          amount,
          type: 'debit',
          description: `Payout request to ${method}`,
        },
      });

      return p;
    });

    return { message: 'Payout request submitted', payout };
  }

  async getStaffPayoutsForCompanyMember(staffId: bigint, companyId: bigint) {
    try {
      const staff = await this.prisma.companyStaff.findFirst({
        where: { id: staffId, companyId },
      });
      if (!staff)
        throw new ForbiddenException('Staff does not belong to your company');

      const payouts = await this.prisma.payout.findMany({
        where: { staffId, payoutType: 'staff' },
        orderBy: { requestedAt: 'desc' },
      });

      return { payouts };
    } catch (e: any) {
      console.error(
        '\n\n=========================================\nCRITICAL STAFF PAYOUT ERROR:',
        e,
        '\n=========================================\n\n',
      );
      throw e;
    }
  }

  async approveStaffPayout(payoutId: number, companyId: bigint) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { staff: true },
    });

    if (!payout || payout.payoutType !== 'staff' || !payout.staff) {
      throw new NotFoundException('Payout not found or staff missing');
    }

    if (payout.staff.companyId !== companyId) {
      throw new ForbiddenException('You cannot approve this payout');
    }

    if (payout.status !== 'pending') {
      throw new BadRequestException('Payout is not pending');
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        processedAt: new Date(),
      },
    });

    return { message: 'Payout approved', payout: updated };
  }

  async rejectStaffPayout(payoutId: number, companyId: bigint) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { staff: true },
    });

    if (!payout || payout.payoutType !== 'staff' || !payout.staff) {
      throw new NotFoundException('Payout not found or staff missing');
    }

    if (payout.staff.companyId !== companyId) {
      throw new ForbiddenException('You cannot reject this payout');
    }

    if (payout.status !== 'pending') {
      throw new BadRequestException('Payout is not pending');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'failed',
          processedAt: new Date(),
        },
      });

      // Refund the staff's wallet balance
      await tx.companyStaff.update({
        where: { id: payout.staffId! },
        data: { walletBalance: { increment: payout.amount } },
      });

      // Record the refund transaction
      await tx.walletTransaction.create({
        data: {
          staffId: payout.staffId!,
          amount: payout.amount,
          type: 'credit',
          description: `Refund for rejected payout request`,
        },
      });

      return p;
    });

    return { message: 'Payout rejected and refunded', payout: updated };
  }

  async getPaymentMethods(companyId: bigint) {
    const methods = await this.prisma.companyPaymentMethod.findMany({
      where: { companyId },
      select: {
        id: true,
        companyId: true,
        type: true,
        accountName: true,
        isDefault: true,
        isVerified: true,
        createdAt: true,
        // accountNumber intentionally excluded — never expose raw account numbers
      },
    });
    return { paymentMethods: methods };
  }

  async addPaymentMethod(
    companyId: bigint,
    dto: {
      type: string;
      accountName: string;
      accountNumber: string;
      routingNumber?: string;
      isDefault?: boolean;
    },
  ) {
    if (dto.isDefault) {
      await this.prisma.companyPaymentMethod.updateMany({
        where: { companyId },
        data: { isDefault: false },
      });
    }

    const method = await this.prisma.companyPaymentMethod.create({
      data: {
        companyId,
        type: dto.type,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        routingNumber: dto.routingNumber ?? null,
        isDefault: dto.isDefault ?? false,
      },
      select: {
        id: true,
        companyId: true,
        type: true,
        accountName: true,
        isDefault: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return { message: 'Payment method added', paymentMethod: method };
  }

  async updatePaymentMethod(
    id: number,
    companyId: bigint,
    dto: { accountName?: string; isDefault?: boolean },
  ) {
    const method = await this.prisma.companyPaymentMethod.findUnique({
      where: { id },
    });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.companyId !== companyId)
      throw new ForbiddenException('Not your payment method');

    if (dto.isDefault) {
      await this.prisma.companyPaymentMethod.updateMany({
        where: { companyId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.companyPaymentMethod.update({
      where: { id },
      data: { accountName: dto.accountName, isDefault: dto.isDefault },
      select: {
        id: true,
        companyId: true,
        type: true,
        accountName: true,
        isDefault: true,
        isVerified: true,
      },
    });

    return { message: 'Payment method updated', paymentMethod: updated };
  }

  async deletePaymentMethod(id: number, companyId: bigint) {
    const method = await this.prisma.companyPaymentMethod.findUnique({
      where: { id },
    });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.companyId !== companyId)
      throw new ForbiddenException('Not your payment method');

    await this.prisma.companyPaymentMethod.delete({ where: { id } });
    return { message: 'Payment method deleted' };
  }

  // --- STAFF PAYMENT METHODS ---

  async getStaffPaymentMethods(staffId: bigint) {
    const methods = await this.prisma.staffPaymentMethod.findMany({
      where: { staffId },
      select: {
        id: true,
        staffId: true,
        type: true,
        accountName: true,
        accountNumber: true,
        routingNumber: true,
        qrCodeUrl: true,
        isDefault: true,
        isVerified: true,
        createdAt: true,
      },
    });
    return { success: true, paymentMethods: methods };
  }

  async addStaffPaymentMethod(
    staffId: bigint,
    dto: {
      type: string;
      accountName: string;
      accountNumber: string;
      routingNumber?: string;
      qrCodeUrl?: string;
      isDefault?: boolean;
    },
  ) {
    if (dto.isDefault) {
      await this.prisma.staffPaymentMethod.updateMany({
        where: { staffId },
        data: { isDefault: false },
      });
    }

    const method = await this.prisma.staffPaymentMethod.create({
      data: {
        staffId,
        type: dto.type,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        routingNumber: dto.routingNumber ?? null,
        qrCodeUrl: dto.qrCodeUrl ?? null,
        isDefault: dto.isDefault ?? false,
      },
      select: {
        id: true,
        staffId: true,
        type: true,
        accountName: true,
        accountNumber: true,
        routingNumber: true,
        qrCodeUrl: true,
        isDefault: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return { message: 'Payment method added', paymentMethod: method };
  }

  async updateStaffPaymentMethod(
    id: number,
    staffId: bigint,
    dto: { accountName?: string; isDefault?: boolean },
  ) {
    const method = await this.prisma.staffPaymentMethod.findUnique({
      where: { id },
    });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.staffId !== staffId)
      throw new ForbiddenException('Not your payment method');

    if (dto.isDefault) {
      await this.prisma.staffPaymentMethod.updateMany({
        where: { staffId },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.staffPaymentMethod.update({
      where: { id },
      data: { accountName: dto.accountName, isDefault: dto.isDefault },
      select: {
        id: true,
        staffId: true,
        type: true,
        accountName: true,
        isDefault: true,
        isVerified: true,
      },
    });

    return { message: 'Payment method updated', paymentMethod: updated };
  }

  async deleteStaffPaymentMethod(id: number, staffId: bigint) {
    const method = await this.prisma.staffPaymentMethod.findUnique({
      where: { id },
    });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.staffId !== staffId)
      throw new ForbiddenException('Not your payment method');

    await this.prisma.staffPaymentMethod.delete({ where: { id } });
    return { message: 'Payment method deleted' };
  }

  // --- ADMIN PAYOUT MANAGEMENT ---

  async getAllPayouts(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.payoutType = type;

    const payouts = await this.prisma.payout.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            owner: { select: { fullName: true, email: true } },
            paymentMethods: true,
          },
        },
        staff: {
          select: {
            id: true,
            user: { select: { fullName: true, email: true } },
            paymentMethods: true,
          },
        },
      },
    });

    return { payouts };
  }

  async processPayout(
    payoutId: number,
    adminUserId: bigint,
    transactionId?: string,
  ) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });
    if (!payout) throw new NotFoundException('Payout not found');

    if (payout.status === 'completed') {
      throw new BadRequestException('Payout already completed');
    }

    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        processedAt: new Date(),
        transactionId,
      },
    });

    return { message: 'Payout marked as completed', payout: updated };
  }
}
