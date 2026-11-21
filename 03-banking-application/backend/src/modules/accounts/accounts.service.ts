import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { EntryType } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCustomerAccounts(customerId: string) {
    return this.prisma.bankAccount.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(customerId: string, id: string) {
    const account = await this.prisma.bankAccount.findFirst({
      where: { id, customerId },
      include: {
        ledgerEntries: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { transaction: true },
        },
      },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  async reconcileLedger(accountId: string) {
    const account = await this.prisma.bankAccount.findUniqueOrThrow({ where: { id: accountId } });
    const entries = await this.prisma.ledgerEntry.findMany({ where: { bankAccountId: accountId } });

    let computed = DecimalUtil.toDecimal(0);
    for (const e of entries) {
      const amt = DecimalUtil.toDecimal(e.amount);
      if (e.entryType === EntryType.CREDIT) {
        computed = DecimalUtil.add(computed, amt);
      } else {
        computed = DecimalUtil.sub(computed, amt);
      }
    }

    const stored = DecimalUtil.toDecimal(account.currentBalance);
    const isMatched = DecimalUtil.equals(computed, stored);

    if (!isMatched) {
      await this.prisma.bankAccount.update({
        where: { id: accountId },
        data: { currentBalance: computed },
      });
    }

    return {
      accountNumber: account.accountNumber,
      storedBalance: DecimalUtil.format(stored),
      ledgerCalculatedBalance: DecimalUtil.format(computed),
      isReconciled: isMatched,
      entriesCount: entries.length,
    };
  }
}
