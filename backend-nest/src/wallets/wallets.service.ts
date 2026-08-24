import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // --- Company Endpoints ---

  async calculateCompanyLedgerBalances(companyId: bigint) {
    const holdHoursSetting = await this.prisma.systemSetting.findUnique({
      where: { keyName: 'PAYOUT_HOLD_HOURS' },
    });
    const holdHours = holdHoursSetting ? Number(holdHoursSetting.value) : 72;
    const cutOffDate = new Date(Date.now() - holdHours * 60 * 60 * 1000);

    const [transactions, pendingPayouts] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { ownerType: 'company', ownerId: companyId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payoutRequest.aggregate({
        where: { ownerType: 'company', ownerId: companyId, status: 'pending' },
        _sum: { amount: true },
      }),
    ]);

    const pendingPayoutsSum = Number(pendingPayouts._sum.amount ?? 0);

    let pendingBalance = 0;
    let totalAvailableCredits = 0;
    let totalCommissions = 0;

    const pendingBookingIds = new Set<string>();

    for (const t of transactions) {
      if (t.category === 'service_payment' && t.bookingId) {
        const isPending = new Date(t.createdAt) > cutOffDate;
        if (isPending) {
          pendingBookingIds.add(t.bookingId.toString());
        }
      }
    }

    for (const t of transactions) {
      const amount = Number(t.amount);

      if (t.category === 'service_payment') {
        const isPending = new Date(t.createdAt) > cutOffDate;
        if (isPending) {
          pendingBalance += amount;
        } else {
          totalAvailableCredits += amount;
        }
      } else if (t.category === 'dispute_freeze' && t.bookingId) {
        const isPending = pendingBookingIds.has(t.bookingId.toString());
        if (isPending) {
          pendingBalance = Math.max(0, pendingBalance - amount);
        } else {
          totalAvailableCredits = Math.max(0, totalAvailableCredits - amount);
        }
      } else if (t.category === 'dispute_release') {
        totalAvailableCredits += amount;
      } else if (t.category === 'deposit') {
        totalAvailableCredits += amount;
      } else if (t.category === 'payout') {
        totalAvailableCredits = Math.max(0, totalAvailableCredits - amount);
      } else if (t.category === 'commission') {
        totalCommissions += amount;
      }
    }

    let availableBalance = 0;
    let outstandingFees = 0;

    if (totalAvailableCredits >= totalCommissions) {
      availableBalance = totalAvailableCredits - totalCommissions;
      outstandingFees = 0;
    } else {
      availableBalance = 0;
      outstandingFees = totalCommissions - totalAvailableCredits;
    }

    // Deduct pending payouts from available balance
    availableBalance = Math.max(0, availableBalance - pendingPayoutsSum);

    return {
      pendingBalance,
      availableBalance,
      outstandingFees,
      transactions,
    };
  }

  // --- Company Endpoints ---

  async getMyCompanyWallet(userId: bigint) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');

    // Fetch payouts to match the frontend expectations
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { ownerType: 'company', ownerId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const walletData = await this.getCompanyWallet(company.id, userId);

    return {
      ...walletData,
      khqrImageUrl: company.khqrImageUrl,
      payouts: payouts.map((p) => ({
        ...p,
        id: p.id.toString(),
        ownerId: p.ownerId.toString(),
        amount: Number(p.amount),
        requestedAt: p.createdAt,
      })),
    };
  }

  async updateCompanyKhqr(userId: bigint, khqrImageUrl: string) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');

    await this.prisma.company.update({
      where: { id: company.id },
      data: { khqrImageUrl },
    });

    return {
      success: true,
      message: 'Company KHQR updated successfully',
      khqrImageUrl,
    };
  }

  async requestMyCompanyPayout(userId: bigint, dto: any) {
    const company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company) throw new NotFoundException('Company not found');
    return this.requestPayout(company.id, userId, dto);
  }

  async getCompanyWallet(companyId: bigint, userId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    const ledger = await this.calculateCompanyLedgerBalances(companyId);

    const totalPaidOut = await this.prisma.payoutRequest.aggregate({
      where: { ownerType: 'company', ownerId: companyId, status: 'approved' },
      _sum: { amount: true },
    });

    // Update the database columns as a cache
    await this.prisma.company
      .update({
        where: { id: companyId },
        data: {
          availableBalance: ledger.availableBalance,
          pendingBalance: ledger.pendingBalance,
        },
      })
      .catch((err) =>
        console.warn('Failed to sync company balance cache:', err.message),
      );

    return {
      balance: ledger.availableBalance,
      pendingBalance: ledger.pendingBalance,
      availableBalance: ledger.availableBalance,
      outstandingFees: ledger.outstandingFees,
      totalPaidOut: Number(totalPaidOut._sum.amount ?? 0),
      transactions: ledger.transactions.slice(0, 50).map((t) => ({
        ...t,
        id: t.id.toString(),
        ownerId: t.ownerId.toString(),
        bookingId: t.bookingId?.toString(),
        amount: Number(t.amount),
      })),
    };
  }

  async requestDeposit(
    companyId: bigint,
    userId: bigint,
    dto: { amount: number; bankName: string; proofOfTransferUrl: string },
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company || company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    const request = await this.prisma.depositRequest.create({
      data: {
        ownerType: 'company',
        ownerId: companyId,
        amount: dto.amount,
        bankName: dto.bankName,
        proofOfTransferUrl: dto.proofOfTransferUrl,
        status: 'pending',
      },
    });

    return {
      success: true,
      request: {
        ...request,
        id: request.id.toString(),
        ownerId: request.ownerId.toString(),
        amount: Number(request.amount),
      },
    };
  }

  async requestPayout(
    companyId: bigint,
    userId: bigint,
    dto: {
      amount: number;
      destinationBank: string;
      accountName: string;
      accountNumber: string;
    },
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company || company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    const ledger = await this.calculateCompanyLedgerBalances(companyId);

    if (ledger.availableBalance < dto.amount) {
      throw new BadRequestException(
        'Insufficient available balance. Pending earnings have not yet cleared the dispute window.',
      );
    }

    // Deduct immediately (hold funds)
    const request = await this.prisma.$transaction(async (tx) => {
      const req = await tx.payoutRequest.create({
        data: {
          ownerType: 'company',
          ownerId: companyId,
          amount: dto.amount,
          destinationBank: dto.destinationBank,
          accountName: dto.accountName,
          accountNumber: dto.accountNumber,
          status: 'pending',
        },
      });

      await tx.company.update({
        where: { id: companyId },
        data: { availableBalance: { decrement: dto.amount } },
      });

      return req;
    });

    return {
      success: true,
      request: {
        ...request,
        id: request.id.toString(),
        ownerId: request.ownerId.toString(),
        amount: Number(request.amount),
      },
    };
  }

  // --- Staff Endpoints ---

  async getStaffWallet(staffId: bigint, userId: bigint) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    if (staff.userId !== userId) throw new ForbiddenException('Access denied');

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { staffId: staffId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      balance: staff.walletBalance,
      transactions: transactions.map((t) => ({
        ...t,
        id: t.id.toString(),
        staffId: t.staffId.toString(),
        bookingId: t.bookingId?.toString(),
        amount: Number(t.amount),
      })),
    };
  }

  async requestStaffPayout(
    staffId: bigint,
    userId: bigint,
    dto: {
      amount: number;
      destinationBank: string;
      accountName: string;
      accountNumber: string;
    },
  ) {
    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.userId !== userId)
      throw new ForbiddenException('Access denied');

    if (Number(staff.walletBalance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Deduct immediately (hold funds)
    const request = await this.prisma.$transaction(async (tx) => {
      await tx.companyStaff.update({
        where: { id: staffId },
        data: { walletBalance: { decrement: dto.amount } },
      });

      return tx.payoutRequest.create({
        data: {
          ownerType: 'staff',
          ownerId: staffId,
          amount: dto.amount,
          destinationBank: dto.destinationBank,
          accountName: dto.accountName,
          accountNumber: dto.accountNumber,
          status: 'pending',
        },
      });
    });

    return {
      success: true,
      request: {
        ...request,
        id: request.id.toString(),
        ownerId: request.ownerId.toString(),
        amount: Number(request.amount),
      },
    };
  }

  async clearStaffDebt(
    companyId: bigint,
    staffId: bigint,
    userId: bigint,
    amount: number,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company || company.ownerId !== userId)
      throw new ForbiddenException('Access denied');

    const staff = await this.prisma.companyStaff.findUnique({
      where: { id: staffId },
    });
    if (!staff || staff.companyId !== companyId)
      throw new NotFoundException('Staff not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.companyStaff.update({
        where: { id: staffId },
        data: { walletBalance: { increment: amount } },
      });

      await tx.walletTransaction.create({
        data: {
          staffId: staffId,
          amount: amount,
          type: 'credit',
          description: `Cash returned to company, digital debt cleared by manager`,
        },
      });
    });

    return { success: true, message: 'Staff debt cleared successfully' };
  }

  // --- Admin Endpoints ---

  async getAdminPendingRequests() {
    const [deposits, payouts] = await Promise.all([
      this.prisma.depositRequest.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payoutRequest.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const enrichedPayouts = await Promise.all(
      payouts.map(async (p) => {
        let khqrImageUrl: string | null = null;
        if (p.ownerType === 'company') {
          const company = await this.prisma.company.findUnique({
            where: { id: p.ownerId },
            select: { khqrImageUrl: true },
          });
          khqrImageUrl = company?.khqrImageUrl ?? null;
        } else if (p.ownerType === 'staff') {
          const staff = await this.prisma.companyStaff.findUnique({
            where: { id: p.ownerId },
            select: { khqrImageUrl: true },
          });
          khqrImageUrl = staff?.khqrImageUrl ?? null;
        }
        return {
          ...p,
          id: p.id.toString(),
          ownerId: p.ownerId.toString(),
          amount: Number(p.amount),
          khqrImageUrl,
        };
      }),
    );

    return {
      deposits: deposits.map((d) => ({
        ...d,
        id: d.id.toString(),
        ownerId: d.ownerId.toString(),
        amount: Number(d.amount),
      })),
      payouts: enrichedPayouts,
    };
  }

  async approveDeposit(id: bigint, adminNotes?: string) {
    const request = await this.prisma.depositRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Deposit request not found');
    if (request.status !== 'pending')
      throw new BadRequestException('Already processed');

    await this.prisma.$transaction(async (tx) => {
      await tx.depositRequest.update({
        where: { id },
        data: { status: 'approved', adminNotes },
      });

      await tx.transaction.create({
        data: {
          ownerType: request.ownerType,
          ownerId: request.ownerId,
          amount: request.amount,
          type: 'credit',
          category: 'deposit',
          description: `Admin approved deposit request #${id}`,
        },
      });

      if (request.ownerType === 'company') {
        await tx.company.update({
          where: { id: request.ownerId },
          // Deposit goes directly to availableBalance (admin-verified external transfer)
          data: { availableBalance: { increment: request.amount } },
        });
      }
    });

    return { success: true, message: 'Deposit approved' };
  }

  async rejectDeposit(id: bigint, adminNotes?: string) {
    const request = await this.prisma.depositRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Deposit request not found');
    if (request.status !== 'pending')
      throw new BadRequestException('Already processed');

    await this.prisma.depositRequest.update({
      where: { id },
      data: { status: 'rejected', adminNotes },
    });

    return { success: true, message: 'Deposit rejected' };
  }

  async approvePayout(id: bigint, adminNotes?: string) {
    const request = await this.prisma.payoutRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Payout request not found');
    if (request.status !== 'pending')
      throw new BadRequestException('Already processed');

    await this.prisma.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id },
        data: { status: 'approved', adminNotes },
      });

      await tx.transaction.create({
        data: {
          ownerType: request.ownerType,
          ownerId: request.ownerId,
          amount: request.amount,
          type: 'debit',
          category: 'payout',
          description: `Admin approved payout request #${id}`,
        },
      });
    });

    if (request.ownerType === 'company') {
      const company = await this.prisma.company.findUnique({
        where: { id: request.ownerId },
        select: { ownerId: true },
      });
      if (company) {
        await this.notificationsService
          .notifyPayoutProcessed(company.ownerId, Number(request.amount))
          .catch((e) =>
            console.warn('Notification failed (payout):', e?.message),
          );
      }
    } else if (request.ownerType === 'staff') {
      const staff = await this.prisma.companyStaff.findUnique({
        where: { id: request.ownerId },
        select: { userId: true },
      });
      if (staff) {
        await this.notificationsService
          .createNotification(
            staff.userId,
            'payout_processed',
            '💰 Payout Processed',
            `Your payout of $${Number(request.amount).toFixed(2)} has been processed.`,
            { amount: Number(request.amount) },
          )
          .catch((e) =>
            console.warn('Notification failed (payout):', e?.message),
          );
      }
    }

    return { success: true, message: 'Payout approved' };
  }

  async rejectPayout(id: bigint, adminNotes?: string) {
    const request = await this.prisma.payoutRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Payout request not found');
    if (request.status !== 'pending')
      throw new BadRequestException('Already processed');

    // Refund the held amount
    await this.prisma.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id },
        data: { status: 'rejected', adminNotes },
      });

      if (request.ownerType === 'company') {
        await tx.company.update({
          where: { id: request.ownerId },
          // Rejected payout refunds back to availableBalance
          data: { availableBalance: { increment: request.amount } },
        });
      } else if (request.ownerType === 'staff') {
        await tx.companyStaff.update({
          where: { id: request.ownerId },
          data: { walletBalance: { increment: request.amount } },
        });
      }
    });

    return { success: true, message: 'Payout rejected and funds returned' };
  }
}
