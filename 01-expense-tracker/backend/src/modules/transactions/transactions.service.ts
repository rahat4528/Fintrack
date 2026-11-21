import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto, CreateTransferDto, UpdateTransactionDto, FilterTransactionDto } from './dto/transactions.dto';
import { DecimalUtil } from '../../common/decimal.util';
import { TransactionType, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.type === TransactionType.TRANSFER) {
      throw new BadRequestException('Use the /transfer endpoint to record transfers');
    }

    // Verify account ownership
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: dto.accountId, userId, isArchived: false },
    });
    if (!account) {
      throw new NotFoundException('Target account not found or is archived');
    }

    const amountDec = DecimalUtil.toDecimal(dto.amount);
    if (!DecimalUtil.isPositive(amountDec)) {
      throw new BadRequestException('Transaction amount must be strictly greater than 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create transaction record
      const createdTx = await tx.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId || null,
          type: dto.type,
          amount: amountDec,
          currency: account.currency,
          description: dto.description,
          notes: dto.notes,
          transactionDate: new Date(dto.transactionDate),
          tags: dto.tagIds?.length
            ? {
                create: dto.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
              }
            : undefined,
        },
        include: {
          category: true,
          account: true,
          tags: { include: { tag: true } },
        },
      });

      // 2. Adjust account balance atomically
      const currentBalance = DecimalUtil.toDecimal(account.currentBalance);
      const newBalance =
        dto.type === TransactionType.INCOME
          ? DecimalUtil.add(currentBalance, amountDec)
          : DecimalUtil.sub(currentBalance, amountDec);

      await tx.financialAccount.update({
        where: { id: account.id },
        data: { currentBalance: newBalance },
      });

      // 3. Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_TRANSACTION',
          entityType: 'Transaction',
          entityId: createdTx.id,
          metadata: {
            type: dto.type,
            amount: DecimalUtil.format(amountDec),
            accountId: account.id,
            previousBalance: DecimalUtil.format(currentBalance),
            newBalance: DecimalUtil.format(newBalance),
          },
        },
      });

      return createdTx;
    });
  }

  async createTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException('Source and destination accounts must be distinct');
    }

    // Verify both accounts belong to the authenticated user
    const sourceAcc = await this.prisma.financialAccount.findFirst({
      where: { id: dto.sourceAccountId, userId, isArchived: false },
    });
    const destAcc = await this.prisma.financialAccount.findFirst({
      where: { id: dto.destinationAccountId, userId, isArchived: false },
    });

    if (!sourceAcc || !destAcc) {
      throw new NotFoundException('Source or destination account not found or is archived');
    }

    const transferAmount = DecimalUtil.toDecimal(dto.amount);
    if (!DecimalUtil.isPositive(transferAmount)) {
      throw new BadRequestException('Transfer amount must be strictly greater than 0');
    }

    const exchangeRate = DecimalUtil.toDecimal(dto.exchangeRate || '1.000000');
    const destinationAmount = DecimalUtil.mul(transferAmount, exchangeRate);
    const txDate = new Date(dto.transactionDate);

    return this.prisma.$transaction(async (tx) => {
      // 1. Debit Source Transaction
      const sourceTx = await tx.transaction.create({
        data: {
          userId,
          accountId: sourceAcc.id,
          type: TransactionType.TRANSFER,
          amount: transferAmount,
          currency: sourceAcc.currency,
          description: dto.description || `Transfer to ${destAcc.name}`,
          transactionDate: txDate,
        },
      });

      // 2. Credit Destination Transaction
      const destTx = await tx.transaction.create({
        data: {
          userId,
          accountId: destAcc.id,
          type: TransactionType.TRANSFER,
          amount: destinationAmount,
          currency: destAcc.currency,
          description: dto.description || `Transfer from ${sourceAcc.name}`,
          transactionDate: txDate,
        },
      });

      // 3. Atomic Transfer Link
      const transferRecord = await tx.transactionTransfer.create({
        data: {
          sourceAccountId: sourceAcc.id,
          destinationAccountId: destAcc.id,
          sourceTransactionId: sourceTx.id,
          destinationTransactionId: destTx.id,
          exchangeRate,
        },
      });

      // 4. Update balances
      const sourceNewBalance = DecimalUtil.sub(sourceAcc.currentBalance, transferAmount);
      const destNewBalance = DecimalUtil.add(destAcc.currentBalance, destinationAmount);

      await tx.financialAccount.update({
        where: { id: sourceAcc.id },
        data: { currentBalance: sourceNewBalance },
      });

      await tx.financialAccount.update({
        where: { id: destAcc.id },
        data: { currentBalance: destNewBalance },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_TRANSFER',
          entityType: 'TransactionTransfer',
          entityId: transferRecord.id,
          metadata: {
            sourceAccountId: sourceAcc.id,
            destinationAccountId: destAcc.id,
            amount: DecimalUtil.format(transferAmount),
            exchangeRate: DecimalUtil.format(exchangeRate, 6),
          },
        },
      });

      return {
        transfer: transferRecord,
        sourceTransaction: sourceTx,
        destinationTransaction: destTx,
      };
    });
  }

  async findAll(userId: string, filter: FilterTransactionDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
    };

    if (filter.accountId) where.accountId = filter.accountId;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.type) where.type = filter.type;

    if (filter.startDate || filter.endDate) {
      where.transactionDate = {};
      if (filter.startDate) where.transactionDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.transactionDate.lte = new Date(filter.endDate);
    }

    if (filter.minAmount || filter.maxAmount) {
      where.amount = {};
      if (filter.minAmount) where.amount.gte = DecimalUtil.toDecimal(filter.minAmount);
      if (filter.maxAmount) where.amount.lte = DecimalUtil.toDecimal(filter.maxAmount);
    }

    if (filter.search) {
      where.OR = [
        { description: { contains: filter.search, mode: 'insensitive' } },
        { notes: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.tagId) {
      where.tags = { some: { tagId: filter.tagId } };
    }

    const page = filter.page && filter.page > 0 ? filter.page : 1;
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          category: true,
          account: true,
          tags: { include: { tag: true } },
          transferAsSource: true,
          transferAsDestination: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        category: true,
        account: true,
        tags: { include: { tag: true } },
        transferAsSource: true,
        transferAsDestination: true,
      },
    });
    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return tx;
  }

  async delete(userId: string, id: string) {
    const txRecord = await this.findById(userId, id);

    return this.prisma.$transaction(async (tx) => {
      // Check if this is a transfer
      if (txRecord.type === TransactionType.TRANSFER) {
        const transferLink = await tx.transactionTransfer.findFirst({
          where: {
            OR: [
              { sourceTransactionId: txRecord.id },
              { destinationTransactionId: txRecord.id },
            ],
          },
        });

        if (transferLink) {
          // Soft-delete both source and destination transactions
          await tx.transaction.updateMany({
            where: {
              id: { in: [transferLink.sourceTransactionId, transferLink.destinationTransactionId] },
            },
            data: { deletedAt: new Date() },
          });

          // Revert balances
          const sourceAcc = await tx.financialAccount.findUniqueOrThrow({
            where: { id: transferLink.sourceAccountId },
          });
          const destAcc = await tx.financialAccount.findUniqueOrThrow({
            where: { id: transferLink.destinationAccountId },
          });

          const srcTx = await tx.transaction.findUniqueOrThrow({
            where: { id: transferLink.sourceTransactionId },
          });
          const dstTx = await tx.transaction.findUniqueOrThrow({
            where: { id: transferLink.destinationTransactionId },
          });

          await tx.financialAccount.update({
            where: { id: sourceAcc.id },
            data: { currentBalance: DecimalUtil.add(sourceAcc.currentBalance, srcTx.amount) },
          });

          await tx.financialAccount.update({
            where: { id: destAcc.id },
            data: { currentBalance: DecimalUtil.sub(destAcc.currentBalance, dstTx.amount) },
          });

          return { message: 'Transfer transactions voided and account balances reverted successfully' };
        }
      }

      // Standard Income / Expense soft delete
      await tx.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      const account = await tx.financialAccount.findUniqueOrThrow({
        where: { id: txRecord.accountId },
      });

      const currentBalance = DecimalUtil.toDecimal(account.currentBalance);
      const amt = DecimalUtil.toDecimal(txRecord.amount);
      const newBalance =
        txRecord.type === TransactionType.INCOME
          ? DecimalUtil.sub(currentBalance, amt)
          : DecimalUtil.add(currentBalance, amt);

      await tx.financialAccount.update({
        where: { id: account.id },
        data: { currentBalance: newBalance },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE_TRANSACTION',
          entityType: 'Transaction',
          entityId: id,
          metadata: {
            amount: DecimalUtil.format(amt),
            previousBalance: DecimalUtil.format(currentBalance),
            newBalance: DecimalUtil.format(newBalance),
          },
        },
      });

      return { message: 'Transaction deleted and balance adjusted successfully' };
    });
  }
}
