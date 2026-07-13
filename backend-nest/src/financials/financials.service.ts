import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayoutRequestDto, ProcessPayoutDto } from './dto/financials.dto';

@Injectable()
export class FinancialsService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= COMPANY ROUTES =================

  async getWallet(user: any) {
    if (user.role !== 'company_admin') {
      throw new BadRequestException('Only companies have a wallet.');
    }

    // A company's wallet balance is the sum of their transactions
    const company = await this.prisma.company.findFirst({
      where: { ownerId: BigInt(user.id) },
    });
    if (!company) throw new NotFoundException('Company not found');

    const transactions = await this.prisma.transaction.findMany({
      where: { ownerType: 'company', ownerId: company.id },
      orderBy: { createdAt: 'desc' },
    });

    const balance = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    
    // Also fetch pending payouts to show reserved balance
    const payouts = await this.prisma.payoutRequest.findMany({
      where: { ownerType: 'company', ownerId: company.id },
      orderBy: { createdAt: 'desc' },
    });

    const pendingAmount = payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, req) => sum + Number(req.amount), 0);

    return {
      balance: balance,
      pendingWithdrawals: pendingAmount,
      payouts: payouts.map(p => ({
        ...p,
        id: p.id.toString(),
        ownerId: p.ownerId.toString(),
        amount: Number(p.amount)
      })),
      transactions: transactions.map(t => ({
        ...t,
        id: t.id.toString(),
        ownerId: t.ownerId.toString(),
        bookingId: t.bookingId?.toString(),
        amount: Number(t.amount)
      })),
    };
  }

  async requestPayout(dto: PayoutRequestDto, user: any) {
    if (user.role !== 'company_admin') {
      throw new BadRequestException('Only companies can request payouts.');
    }

    const company = await this.prisma.company.findFirst({
      where: { ownerId: BigInt(user.id) },
    });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Calculate current balance
      const transactions = await tx.transaction.findMany({
        where: { ownerType: 'company', ownerId: company.id },
      });
      const balance = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

      if (balance < dto.amount) {
        throw new BadRequestException('Insufficient balance.');
      }

      // 2. Create the Payout Request
      const request = await tx.payoutRequest.create({
        data: {
          ownerType: 'company',
          ownerId: company.id,
          amount: dto.amount,
          destinationBank: dto.destinationBank,
          accountName: dto.accountName,
          accountNumber: dto.accountNumber,
          status: 'pending',
        }
      });

      // 3. Deduct the amount immediately (pending deduction)
      await tx.transaction.create({
        data: {
          ownerType: 'company',
          ownerId: company.id,
          amount: -dto.amount,
          type: 'debit',
          category: 'payout',
          description: `Withdrawal request #${request.id}`,
        }
      });

      return {
        ...request,
        id: request.id.toString(),
        ownerId: request.ownerId.toString(),
        amount: Number(request.amount)
      };
    });
  }

  // ================= ADMIN ROUTES =================

  async getAllPayoutRequests() {
    const requests = await this.prisma.payoutRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(r => ({
      ...r,
      id: r.id.toString(),
      ownerId: r.ownerId.toString(),
      amount: Number(r.amount)
    }));
  }

  async processPayoutRequest(id: bigint, dto: ProcessPayoutDto) {
    const request = await this.prisma.payoutRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Payout request not found');
    if (request.status !== 'pending') {
      throw new ConflictException(`Request is already ${request.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the request
      const updated = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes,
        }
      });

      // 2. If rejected, refund the wallet
      if (dto.status === 'rejected') {
        await tx.transaction.create({
          data: {
            ownerType: request.ownerType,
            ownerId: request.ownerId,
            amount: request.amount, // Refund the amount (positive)
            type: 'credit',
            category: 'refund',
            description: `Refund for rejected payout request #${request.id}`,
          }
        });
      }

      return {
        ...updated,
        id: updated.id.toString(),
        ownerId: updated.ownerId.toString(),
        amount: Number(updated.amount)
      };
    });
  }
}
