import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { EventType } from '@prisma/client';

@Injectable()
export class AllocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async setAllocation(userId: string, periodId: string, categoryId: string, newAssignedStr: string) {
    const period = await this.prisma.budgetPeriod.findFirst({
      where: { id: periodId, budget: { userId } },
      include: { budget: true },
    });
    if (!period) throw new NotFoundException('Budget period not found');

    const newAssigned = DecimalUtil.toDecimal(newAssignedStr);

    return this.prisma.$transaction(async (tx) => {
      // Find or create current allocation
      const existingAlloc = await tx.allocation.findUnique({
        where: { periodId_categoryId: { periodId, categoryId } },
      });

      const oldAssigned = DecimalUtil.toDecimal(existingAlloc?.assignedAmount || '0.00');
      const assignedDiff = DecimalUtil.sub(newAssigned, oldAssigned);

      const oldActivity = DecimalUtil.toDecimal(existingAlloc?.activityAmount || '0.00');
      const newAvailable = DecimalUtil.sub(newAssigned, oldActivity);

      const updatedAlloc = await tx.allocation.upsert({
        where: { periodId_categoryId: { periodId, categoryId } },
        update: {
          assignedAmount: newAssigned,
          availableAmount: newAvailable,
        },
        create: {
          periodId,
          categoryId,
          assignedAmount: newAssigned,
          activityAmount: oldActivity,
          availableAmount: newAvailable,
        },
      });

      // Update Period: totalAssigned increases by diff, readyToAssign decreases by diff
      const currentPeriodAssigned = DecimalUtil.toDecimal(period.totalAssigned);
      const newPeriodAssigned = DecimalUtil.add(currentPeriodAssigned, assignedDiff);

      const currentReadyToAssign = DecimalUtil.toDecimal(period.readyToAssign);
      const newReadyToAssign = DecimalUtil.sub(currentReadyToAssign, assignedDiff);

      await tx.budgetPeriod.update({
        where: { id: period.id },
        data: {
          totalAssigned: newPeriodAssigned,
          readyToAssign: newReadyToAssign,
        },
      });

      // Append BudgetEvent
      const eventCount = await tx.budgetEvent.count({ where: { budgetId: period.budgetId } });
      await tx.budgetEvent.create({
        data: {
          budgetId: period.budgetId,
          sequenceNumber: eventCount + 1,
          eventType: EventType.ALLOCATE_FUNDS,
          payload: {
            categoryId,
            previousAssigned: DecimalUtil.format(oldAssigned),
            newAssigned: DecimalUtil.format(newAssigned),
            readyToAssign: DecimalUtil.format(newReadyToAssign),
          },
        },
      });

      return {
        allocation: updatedAlloc,
        periodReadyToAssign: DecimalUtil.format(newReadyToAssign),
        periodTotalAssigned: DecimalUtil.format(newPeriodAssigned),
      };
    });
  }

  async transferBetweenEnvelopes(
    userId: string,
    periodId: string,
    sourceCategoryId: string,
    destinationCategoryId: string,
    amountStr: string,
  ) {
    if (sourceCategoryId === destinationCategoryId) {
      throw new BadRequestException('Source and destination envelopes must be different');
    }

    const transferAmount = DecimalUtil.toDecimal(amountStr);
    if (!DecimalUtil.toDecimal(transferAmount).isPositive()) {
      throw new BadRequestException('Transfer amount must be strictly greater than 0');
    }

    const period = await this.prisma.budgetPeriod.findFirst({
      where: { id: periodId, budget: { userId } },
    });
    if (!period) throw new NotFoundException('Period not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Source Allocation
      const sourceAlloc = await tx.allocation.findUnique({
        where: { periodId_categoryId: { periodId, categoryId: sourceCategoryId } },
      });
      const srcAssigned = DecimalUtil.toDecimal(sourceAlloc?.assignedAmount || '0.00');
      const srcAvailable = DecimalUtil.toDecimal(sourceAlloc?.availableAmount || '0.00');

      const newSrcAssigned = DecimalUtil.sub(srcAssigned, transferAmount);
      const newSrcAvailable = DecimalUtil.sub(srcAvailable, transferAmount);

      await tx.allocation.upsert({
        where: { periodId_categoryId: { periodId, categoryId: sourceCategoryId } },
        update: { assignedAmount: newSrcAssigned, availableAmount: newSrcAvailable },
        create: {
          periodId,
          categoryId: sourceCategoryId,
          assignedAmount: newSrcAssigned,
          availableAmount: newSrcAvailable,
        },
      });

      // 2. Destination Allocation
      const destAlloc = await tx.allocation.findUnique({
        where: { periodId_categoryId: { periodId, categoryId: destinationCategoryId } },
      });
      const dstAssigned = DecimalUtil.toDecimal(destAlloc?.assignedAmount || '0.00');
      const dstAvailable = DecimalUtil.toDecimal(destAlloc?.availableAmount || '0.00');

      const newDstAssigned = DecimalUtil.add(dstAssigned, transferAmount);
      const newDstAvailable = DecimalUtil.add(dstAvailable, transferAmount);

      await tx.allocation.upsert({
        where: { periodId_categoryId: { periodId, categoryId: destinationCategoryId } },
        update: { assignedAmount: newDstAssigned, availableAmount: newDstAvailable },
        create: {
          periodId,
          categoryId: destinationCategoryId,
          assignedAmount: newDstAssigned,
          availableAmount: newDstAvailable,
        },
      });

      // 3. Record BudgetTransfer
      const transfer = await tx.budgetTransfer.create({
        data: {
          periodId,
          sourceCategoryId,
          destinationCategoryId,
          amount: transferAmount,
        },
      });

      // 4. Record Event (Zero-sum: Ready to assign unchanged!)
      const eventCount = await tx.budgetEvent.count({ where: { budgetId: period.budgetId } });
      await tx.budgetEvent.create({
        data: {
          budgetId: period.budgetId,
          sequenceNumber: eventCount + 1,
          eventType: EventType.TRANSFER_BETWEEN_ENVELOPES,
          payload: {
            sourceCategoryId,
            destinationCategoryId,
            amount: DecimalUtil.format(transferAmount),
          },
        },
      });

      return {
        transferId: transfer.id,
        sourceAvailable: DecimalUtil.format(newSrcAvailable),
        destinationAvailable: DecimalUtil.format(newDstAvailable),
        readyToAssign: DecimalUtil.format(period.readyToAssign),
      };
    });
  }
}
