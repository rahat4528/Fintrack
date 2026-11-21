import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { AccountStatus, EntryType, TransferStatus } from '@prisma/client';

export class ExecuteTransferDto {
  sourceAccountId: string;
  destAccountNumber: string;
  amount: string;
  description?: string;
}

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async executeTransfer(customerId: string, dto: ExecuteTransferDto, idempotencyKey: string) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is mandatory for banking transfers');
    }

    // 1. Idempotency Check
    const existing = await this.prisma.transferRequest.findUnique({
      where: { idempotencyKey },
      include: { ledgerTransaction: { include: { entries: true } } },
    });
    if (existing) {
      return {
        message: 'Duplicate request returned from idempotency cache',
        transfer: existing,
      };
    }

    // 2. Account checks
    const sourceAcc = await this.prisma.bankAccount.findFirst({
      where: { id: dto.sourceAccountId, customerId },
    });
    if (!sourceAcc) throw new NotFoundException('Source bank account not found');
    if (sourceAcc.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException(`Source account is ${sourceAcc.status} and cannot transact`);
    }

    const destAcc = await this.prisma.bankAccount.findUnique({
      where: { accountNumber: dto.destAccountNumber },
    });
    if (!destAcc) throw new NotFoundException(`Destination account ${dto.destAccountNumber} does not exist`);
    if (destAcc.status !== AccountStatus.ACTIVE) {
      throw new BadRequestException(`Destination account is ${destAcc.status}`);
    }

    if (sourceAcc.id === destAcc.id) {
      throw new BadRequestException('Cannot transfer to identical source account');
    }

    const amount = DecimalUtil.toDecimal(dto.amount);
    if (!DecimalUtil.toDecimal(amount).isPositive()) {
      throw new BadRequestException('Transfer amount must be strictly greater than 0');
    }

    // 3. Limit Enforcement
    const limit = await this.prisma.transactionLimit.findUnique({
      where: { accountType: sourceAcc.accountType },
    });
    if (limit && DecimalUtil.toDecimal(amount).greaterThan(limit.maxSingleTransfer)) {
      throw new BadRequestException(
        `Transfer amount $${DecimalUtil.format(amount)} exceeds maximum single transfer limit of $${DecimalUtil.format(limit.maxSingleTransfer)}`,
      );
    }

    // 4. Overdraft Prevention
    const available = DecimalUtil.toDecimal(sourceAcc.currentBalance);
    if (available.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient available balance ($${DecimalUtil.format(available)}) to complete transfer of $${DecimalUtil.format(amount)}`,
      );
    }

    // 5. Execute Double-Entry Transaction
    return this.prisma.$transaction(async (tx) => {
      const refCode = `TX-SIM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // Create LedgerTransaction
      const ledgerTx = await tx.ledgerTransaction.create({
        data: {
          referenceCode: refCode,
          description: dto.description || `Simulated transfer to ${destAcc.accountNumber}`,
          status: TransferStatus.COMPLETED,
        },
      });

      // Entry 1: Debit Source
      const debitEntry = await tx.ledgerEntry.create({
        data: {
          ledgerTransactionId: ledgerTx.id,
          bankAccountId: sourceAcc.id,
          entryType: EntryType.DEBIT,
          amount,
        },
      });

      // Entry 2: Credit Destination
      const creditEntry = await tx.ledgerEntry.create({
        data: {
          ledgerTransactionId: ledgerTx.id,
          bankAccountId: destAcc.id,
          entryType: EntryType.CREDIT,
          amount,
        },
      });

      // Assert zero-sum
      if (!DecimalUtil.equals(debitEntry.amount, creditEntry.amount)) {
        throw new Error('Ledger zero-sum invariant violated during double-entry creation');
      }

      // Update account balances
      const newSourceBal = DecimalUtil.sub(sourceAcc.currentBalance, amount);
      const newDestBal = DecimalUtil.add(destAcc.currentBalance, amount);

      await tx.bankAccount.update({
        where: { id: sourceAcc.id },
        data: { currentBalance: newSourceBal },
      });

      await tx.bankAccount.update({
        where: { id: destAcc.id },
        data: { currentBalance: newDestBal },
      });

      // Create Transfer Request record
      const transferRequest = await tx.transferRequest.create({
        data: {
          customerId,
          sourceAccountId: sourceAcc.id,
          destAccountId: destAcc.id,
          amount,
          idempotencyKey,
          status: TransferStatus.COMPLETED,
          ledgerTransactionId: ledgerTx.id,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: 'EXECUTE_TRANSFER',
          entityType: 'TransferRequest',
          entityId: transferRequest.id,
          metadata: {
            referenceCode: refCode,
            amount: DecimalUtil.format(amount),
            sourceAccount: sourceAcc.accountNumber,
            destAccount: destAcc.accountNumber,
          },
        },
      });

      return {
        message: 'Simulated transfer completed successfully',
        referenceCode: refCode,
        amount: DecimalUtil.format(amount),
        sourceBalance: DecimalUtil.format(newSourceBal),
        transfer: transferRequest,
      };
    });
  }
}
