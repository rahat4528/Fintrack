import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { UserRole } from '@prisma/client';

export interface SetLimitDto {
  bankAccountId?: string;
  dailyLimitAmount: string;
  singleTransactionLimitAmount: string;
  currency: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listLimits() {
    const limits = await this.prisma.transactionLimit.findMany({
      include: {
        bankAccount: {
          select: { accountNumber: true, accountType: true, currency: true },
        },
      },
    });

    return limits.map((l) => ({
      ...l,
      dailyLimitAmount: DecimalUtil.format(l.dailyLimitAmount, 2),
      singleTransactionLimitAmount: DecimalUtil.format(l.singleTransactionLimitAmount, 2),
    }));
  }

  async setLimit(dto: SetLimitDto) {
    return this.prisma.transactionLimit.upsert({
      where: {
        id: dto.bankAccountId ? `LIMIT-${dto.bankAccountId}` : 'GLOBAL-DEFAULT',
      },
      create: {
        id: dto.bankAccountId ? `LIMIT-${dto.bankAccountId}` : 'GLOBAL-DEFAULT',
        bankAccountId: dto.bankAccountId || null,
        dailyLimitAmount: DecimalUtil.toPrisma(dto.dailyLimitAmount),
        singleTransactionLimitAmount: DecimalUtil.toPrisma(dto.singleTransactionLimitAmount),
        currency: dto.currency || 'USD',
      },
      update: {
        dailyLimitAmount: DecimalUtil.toPrisma(dto.dailyLimitAmount),
        singleTransactionLimitAmount: DecimalUtil.toPrisma(dto.singleTransactionLimitAmount),
      },
    });
  }

  async listAuditLogs(limit = 100) {
    const [securityEvents, ledgerTransactions] = await Promise.all([
      this.prisma.securityEvent.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, role: true } },
        },
      }),
      this.prisma.ledgerTransaction.findMany({
        take: limit,
        orderBy: { postedAt: 'desc' },
        include: {
          entries: {
            include: {
              bankAccount: { select: { accountNumber: true } },
            },
          },
        },
      }),
    ]);

    return {
      securityEvents,
      ledgerTransactions: ledgerTransactions.map((tx) => ({
        id: tx.id,
        referenceNumber: tx.referenceNumber,
        transactionType: tx.transactionType,
        description: tx.description,
        totalAmount: DecimalUtil.format(tx.totalAmount, 2),
        currency: tx.currency,
        postedAt: tx.postedAt,
        entriesCount: tx.entries.length,
      })),
    };
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isLocked: true,
        failedAttempts: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  async toggleLockUser(userId: string, isLocked: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isLocked, failedAttempts: isLocked ? 5 : 0 },
      select: { id: true, email: true, isLocked: true },
    });
  }
}
