import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { EntryType, UserRole } from '@prisma/client';
import Decimal from 'decimal.js';

export interface StatementSummary {
  accountNumber: string;
  accountType: string;
  currency: string;
  statementPeriod: {
    startDate: string;
    endDate: string;
  };
  openingBalance: string;
  totalCredits: string;
  totalDebits: string;
  closingBalance: string;
  transactionsCount: number;
  entries: Array<{
    date: Date;
    description: string;
    entryType: EntryType;
    amount: string;
    runningBalance: string;
  }>;
}

@Injectable()
export class StatementsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateStatement(
    accountNumber: string,
    startDateStr?: string,
    endDateStr?: string,
    requestingUser?: { id: string; role: UserRole; customerProfileId?: string },
  ): Promise<StatementSummary> {
    const account = await this.prisma.bankAccount.findUnique({
      where: { accountNumber },
      include: {
        customerProfile: true,
      },
    });

    if (!account) throw new NotFoundException('Account not found');

    if (
      requestingUser &&
      requestingUser.role === UserRole.CUSTOMER &&
      account.customerProfileId !== requestingUser.customerProfileId
    ) {
      throw new ForbiddenException('Unauthorized access to account statement');
    }

    const startDate = startDateStr ? new Date(startDateStr) : new Date(0);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    // 1. Calculate opening balance: sum of entries posted BEFORE startDate
    const priorEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        bankAccountId: account.id,
        createdAt: { lt: startDate },
      },
    });

    let openingDecimal = new Decimal(0);
    for (const pe of priorEntries) {
      const entryAmt = DecimalUtil.toDecimal(pe.amount);
      if (pe.entryType === EntryType.CREDIT) {
        openingDecimal = openingDecimal.plus(entryAmt);
      } else {
        openingDecimal = openingDecimal.minus(entryAmt);
      }
    }

    // 2. Fetch statement entries in date range
    const periodEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        bankAccountId: account.id,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        ledgerTransaction: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    let currentRunning = openingDecimal;
    let totalCredits = new Decimal(0);
    let totalDebits = new Decimal(0);

    const formattedEntries = periodEntries.map((e) => {
      const amt = DecimalUtil.toDecimal(e.amount);
      if (e.entryType === EntryType.CREDIT) {
        currentRunning = currentRunning.plus(amt);
        totalCredits = totalCredits.plus(amt);
      } else {
        currentRunning = currentRunning.minus(amt);
        totalDebits = totalDebits.plus(amt);
      }

      return {
        date: e.createdAt,
        description: e.ledgerTransaction.description,
        entryType: e.entryType,
        amount: DecimalUtil.format(amt, 2),
        runningBalance: DecimalUtil.format(currentRunning, 2),
      };
    });

    const closingDecimal = openingDecimal.plus(totalCredits).minus(totalDebits);

    return {
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currency: account.currency,
      statementPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      openingBalance: DecimalUtil.format(openingDecimal, 2),
      totalCredits: DecimalUtil.format(totalCredits, 2),
      totalDebits: DecimalUtil.format(totalDebits, 2),
      closingBalance: DecimalUtil.format(closingDecimal, 2),
      transactionsCount: formattedEntries.length,
      entries: formattedEntries,
    };
  }
}
