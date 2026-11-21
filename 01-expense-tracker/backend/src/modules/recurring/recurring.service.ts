import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecurrenceFrequency, TransactionType } from '@prisma/client';
import { DecimalUtil } from '../../common/decimal.util';

@Injectable()
export class RecurringService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.recurringTransaction.findMany({
      where: { userId },
      include: { occurrences: true },
      orderBy: { nextOccurrence: 'asc' },
    });
  }

  async create(
    userId: string,
    data: {
      accountId: string;
      categoryId?: string;
      type: TransactionType;
      amount: string;
      description: string;
      frequency: RecurrenceFrequency;
      startDate: string;
      autoPost?: boolean;
    },
  ) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: data.accountId, userId, isArchived: false },
    });
    if (!account) {
      throw new NotFoundException('Account not found or archived');
    }

    const startDate = new Date(data.startDate);
    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        type: data.type,
        amount: DecimalUtil.toDecimal(data.amount),
        currency: account.currency,
        description: data.description,
        frequency: data.frequency,
        startDate,
        nextOccurrence: startDate,
        autoPost: data.autoPost !== false,
      },
    });
  }

  async processDueOccurrences(userId: string) {
    const now = new Date();
    const activeRecurring = await this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        autoPost: true,
        nextOccurrence: { lte: now },
      },
      include: { user: true },
    });

    const generatedResults = [];

    for (const rec of activeRecurring) {
      const occurrenceDate = new Date(rec.nextOccurrence);
      occurrenceDate.setHours(0, 0, 0, 0);

      // Check if this occurrence was already posted (idempotency guard)
      const existing = await this.prisma.recurringOccurrence.findUnique({
        where: {
          recurringId_occurrenceDate: {
            recurringId: rec.id,
            occurrenceDate,
          },
        },
      });

      if (!existing) {
        await this.prisma.$transaction(async (tx) => {
          // Record occurrence
          await tx.recurringOccurrence.create({
            data: {
              recurringId: rec.id,
              occurrenceDate,
              status: 'POSTED',
            },
          });

          // Create the transaction
          const createdTx = await tx.transaction.create({
            data: {
              userId,
              accountId: rec.accountId,
              categoryId: rec.categoryId,
              recurringId: rec.id,
              type: rec.type,
              amount: rec.amount,
              currency: rec.currency,
              description: `[Recurring] ${rec.description}`,
              transactionDate: rec.nextOccurrence,
            },
          });

          // Update account balance
          const account = await tx.financialAccount.findUniqueOrThrow({
            where: { id: rec.accountId },
          });

          const currentBal = DecimalUtil.toDecimal(account.currentBalance);
          const amt = DecimalUtil.toDecimal(rec.amount);
          const newBal =
            rec.type === TransactionType.INCOME
              ? DecimalUtil.add(currentBal, amt)
              : DecimalUtil.sub(currentBal, amt);

          await tx.financialAccount.update({
            where: { id: account.id },
            data: { currentBalance: newBal },
          });

          // Advance nextOccurrence
          const nextDate = this.calculateNextDate(rec.nextOccurrence, rec.frequency);
          await tx.recurringTransaction.update({
            where: { id: rec.id },
            data: { nextOccurrence: nextDate },
          });

          generatedResults.push({
            recurringId: rec.id,
            transactionId: createdTx.id,
            occurrenceDate,
            amount: rec.amount,
          });
        });
      }
    }

    return {
      processedCount: generatedResults.length,
      occurrences: generatedResults,
    };
  }

  private calculateNextDate(current: Date, freq: RecurrenceFrequency): Date {
    const next = new Date(current);
    if (freq === RecurrenceFrequency.DAILY) next.setDate(next.getDate() + 1);
    else if (freq === RecurrenceFrequency.WEEKLY) next.setDate(next.getDate() + 7);
    else if (freq === RecurrenceFrequency.BIWEEKLY) next.setDate(next.getDate() + 14);
    else if (freq === RecurrenceFrequency.MONTHLY) next.setMonth(next.getMonth() + 1);
    else if (freq === RecurrenceFrequency.YEARLY) next.setFullYear(next.getFullYear() + 1);
    return next;
  }
}
