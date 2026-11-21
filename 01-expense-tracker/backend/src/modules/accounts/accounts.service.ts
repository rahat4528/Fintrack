import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/accounts.dto';
import { DecimalUtil } from '../../common/decimal.util';
import { TransactionType } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, includeArchived = false) {
    return this.prisma.financialAccount.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(userId: string, id: string) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    return account;
  }

  async create(userId: string, dto: CreateAccountDto) {
    const initBal = DecimalUtil.toDecimal(dto.initialBalance || '0.00');
    return this.prisma.financialAccount.create({
      data: {
        userId,
        name: dto.name,
        accountType: dto.accountType,
        currency: dto.currency || 'USD',
        initialBalance: initBal,
        currentBalance: initBal,
        colorHex: dto.colorHex || '#3b82f6',
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findById(userId, id);
    return this.prisma.financialAccount.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.accountType ? { accountType: dto.accountType } : {}),
        ...(dto.colorHex ? { colorHex: dto.colorHex } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
    });
  }

  async archive(userId: string, id: string) {
    await this.findById(userId, id);
    return this.prisma.financialAccount.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async reconcile(userId: string, id: string) {
    const account = await this.findById(userId, id);

    // Fetch all active non-deleted transactions for this account
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId: id, deletedAt: null },
      include: {
        transferAsSource: true,
        transferAsDestination: true,
      },
    });

    let calculated = DecimalUtil.toDecimal(account.initialBalance);
    for (const tx of transactions) {
      const amt = DecimalUtil.toDecimal(tx.amount);
      if (tx.type === TransactionType.INCOME) {
        calculated = DecimalUtil.add(calculated, amt);
      } else if (tx.type === TransactionType.EXPENSE) {
        calculated = DecimalUtil.sub(calculated, amt);
      } else if (tx.type === TransactionType.TRANSFER) {
        if (tx.transferAsSource) {
          calculated = DecimalUtil.sub(calculated, amt);
        } else if (tx.transferAsDestination) {
          calculated = DecimalUtil.add(calculated, amt);
        }
      }
    }

    const current = DecimalUtil.toDecimal(account.currentBalance);
    const isMatched = DecimalUtil.equals(calculated, current);
    const discrepancy = DecimalUtil.sub(calculated, current);

    // If drift detected, heal the currentBalance inside an atomic update
    if (!isMatched) {
      await this.prisma.financialAccount.update({
        where: { id },
        data: { currentBalance: calculated },
      });
    }

    return {
      accountId: id,
      accountName: account.name,
      currency: account.currency,
      storedBalance: DecimalUtil.format(current),
      calculatedBalance: DecimalUtil.format(calculated),
      discrepancy: DecimalUtil.format(discrepancy),
      isReconciled: isMatched,
      healed: !isMatched,
      transactionCount: transactions.length,
      timestamp: new Date().toISOString(),
    };
  }
}
