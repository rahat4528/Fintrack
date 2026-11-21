import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { DecimalUtil } from '../../common/decimal.util';
import * as crypto from 'crypto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ImportExportService {
  constructor(private readonly prisma: PrismaService) {}

  generateContentHash(date: string, amount: string, description: string): string {
    const raw = `${date.trim()}:${amount.trim()}:${description.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async previewCsv(
    userId: string,
    csvContent: string,
    mapping: { dateCol: string; amountCol: string; descCol: string; typeCol?: string; categoryCol?: string },
  ) {
    let rows: any[] = [];
    try {
      rows = parse(csvContent, { columns: true, skip_empty_lines: true, trim: true });
    } catch (err) {
      throw new BadRequestException('Malformed CSV content');
    }

    if (rows.length === 0) {
      return { total: 0, preview: [], duplicates: 0, errors: 0 };
    }

    const previewItems = [];
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawDate = row[mapping.dateCol];
      const rawAmount = row[mapping.amountCol];
      const rawDesc = row[mapping.descCol];
      const rawType = mapping.typeCol ? row[mapping.typeCol] : 'EXPENSE';

      const validationErrors: string[] = [];

      if (!rawDate || isNaN(Date.parse(rawDate))) {
        validationErrors.push('Invalid or missing date');
      }
      if (!rawAmount || isNaN(Number(rawAmount))) {
        validationErrors.push('Invalid or missing numeric amount');
      }
      if (!rawDesc) {
        validationErrors.push('Missing description');
      }

      if (validationErrors.length > 0) {
        errorCount++;
        previewItems.push({
          rowNumber: i + 1,
          isValid: false,
          errors: validationErrors,
          raw: row,
        });
        continue;
      }

      const parsedDate = new Date(rawDate).toISOString();
      const cleanAmount = Math.abs(Number(rawAmount)).toFixed(2);
      const hash = this.generateContentHash(parsedDate.split('T')[0], cleanAmount, rawDesc);

      // Check if hash already exists in DB
      const existing = await this.prisma.transaction.findFirst({
        where: { userId, contentHash: hash, deletedAt: null },
      });

      const isDuplicate = !!existing;
      if (isDuplicate) duplicateCount++;

      let inferredType: TransactionType = TransactionType.EXPENSE;
      if (rawType?.toUpperCase() === 'INCOME' || Number(rawAmount) > 0 && !mapping.typeCol) {
        inferredType = TransactionType.INCOME;
      }

      previewItems.push({
        rowNumber: i + 1,
        isValid: true,
        isDuplicate,
        contentHash: hash,
        transactionDate: parsedDate,
        amount: cleanAmount,
        type: inferredType,
        description: rawDesc,
      });
    }

    return {
      totalRows: rows.length,
      validRows: previewItems.filter((p) => p.isValid && !p.isDuplicate).length,
      duplicateRows: duplicateCount,
      failedRows: errorCount,
      preview: previewItems.slice(0, 50),
    };
  }

  async commitImport(
    userId: string,
    accountId: string,
    filename: string,
    validRecords: Array<{
      contentHash: string;
      transactionDate: string;
      amount: string;
      type: TransactionType;
      description: string;
      categoryId?: string;
    }>,
  ) {
    const account = await this.prisma.financialAccount.findFirst({
      where: { id: accountId, userId, isArchived: false },
    });
    if (!account) {
      throw new NotFoundException('Account not found or is archived');
    }

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          userId,
          filename: filename || 'import.csv',
          totalRows: validRecords.length,
          importedRows: validRecords.length,
          duplicateRows: 0,
          failedRows: 0,
        },
      });

      let netBalanceShift = DecimalUtil.toDecimal(0);

      for (const rec of validRecords) {
        const amt = DecimalUtil.toDecimal(rec.amount);
        await tx.transaction.create({
          data: {
            userId,
            accountId,
            importBatchId: batch.id,
            type: rec.type,
            amount: amt,
            currency: account.currency,
            description: rec.description,
            transactionDate: new Date(rec.transactionDate),
            contentHash: rec.contentHash,
          },
        });

        if (rec.type === TransactionType.INCOME) {
          netBalanceShift = DecimalUtil.add(netBalanceShift, amt);
        } else {
          netBalanceShift = DecimalUtil.sub(netBalanceShift, amt);
        }
      }

      const currentBalance = DecimalUtil.toDecimal(account.currentBalance);
      const newBalance = DecimalUtil.add(currentBalance, netBalanceShift);

      await tx.financialAccount.update({
        where: { id: account.id },
        data: { currentBalance: newBalance },
      });

      return {
        batchId: batch.id,
        importedCount: validRecords.length,
        newAccountBalance: DecimalUtil.format(newBalance),
      };
    });
  }

  async undoBatch(userId: string, batchId: string) {
    const batch = await this.prisma.importBatch.findFirst({
      where: { id: batchId, userId },
      include: { transactions: true },
    });
    if (!batch) {
      throw new NotFoundException(`Import batch ${batchId} not found`);
    }
    if (batch.isReverted) {
      throw new BadRequestException('Import batch has already been reverted');
    }

    return this.prisma.$transaction(async (tx) => {
      // Group adjustments by account
      const accountShifts = new Map<string, any>();

      for (const t of batch.transactions) {
        if (!accountShifts.has(t.accountId)) {
          accountShifts.set(t.accountId, DecimalUtil.toDecimal(0));
        }
        const shift = accountShifts.get(t.accountId);
        const amt = DecimalUtil.toDecimal(t.amount);

        // Reversing: income subtracts, expense adds
        if (t.type === TransactionType.INCOME) {
          accountShifts.set(t.accountId, DecimalUtil.sub(shift, amt));
        } else {
          accountShifts.set(t.accountId, DecimalUtil.add(shift, amt));
        }
      }

      // Soft delete transactions
      await tx.transaction.updateMany({
        where: { importBatchId: batch.id },
        data: { deletedAt: new Date() },
      });

      // Update accounts
      for (const [accId, shiftAmt] of accountShifts.entries()) {
        const acc = await tx.financialAccount.findUniqueOrThrow({ where: { id: accId } });
        const updatedBal = DecimalUtil.add(acc.currentBalance, shiftAmt);
        await tx.financialAccount.update({
          where: { id: accId },
          data: { currentBalance: updatedBal },
        });
      }

      // Mark batch reverted
      await tx.importBatch.update({
        where: { id: batch.id },
        data: { isReverted: true },
      });

      return {
        message: 'Import batch successfully reverted and account balances restored',
        revertedTransactionsCount: batch.transactions.length,
      };
    });
  }

  async exportCsv(userId: string): Promise<string> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: { account: true, category: true },
      orderBy: { transactionDate: 'desc' },
    });

    const rows = transactions.map((t) => ({
      ID: t.id,
      Date: t.transactionDate.toISOString().split('T')[0],
      Account: t.account.name,
      Type: t.type,
      Category: t.category?.name || 'Uncategorized',
      Amount: DecimalUtil.format(t.amount),
      Currency: t.currency,
      Description: t.description,
      Notes: t.notes || '',
    }));

    return stringify(rows, { header: true });
  }
}
