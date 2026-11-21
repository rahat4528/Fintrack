import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { EventType } from '@prisma/client';

export interface SyncEventPayload {
  clientEventId: string;
  eventType: EventType;
  payload: any;
  timestamp: string;
}

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async getEventsSince(userId: string, budgetId: string, sinceSequence: number = 0) {
    return this.prisma.budgetEvent.findMany({
      where: {
        budgetId,
        budget: { userId },
        sequenceNumber: { gt: sinceSequence },
      },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async ingestClientEvents(userId: string, budgetId: string, clientEvents: SyncEventPayload[]) {
    const budget = await this.prisma.budget.findFirst({ where: { id: budgetId, userId } });
    if (!budget) throw new BadRequestException('Budget not found');

    const results = [];
    for (const evt of clientEvents) {
      const existing = await this.prisma.budgetEvent.findUnique({
        where: { clientEventId: evt.clientEventId },
      });

      if (!existing) {
        const count = await this.prisma.budgetEvent.count({ where: { budgetId } });
        const created = await this.prisma.budgetEvent.create({
          data: {
            budgetId,
            clientEventId: evt.clientEventId,
            sequenceNumber: count + 1,
            eventType: evt.eventType,
            payload: evt.payload,
            timestamp: new Date(evt.timestamp),
          },
        });
        results.push({ clientEventId: evt.clientEventId, status: 'SYNCED', sequence: created.sequenceNumber });
      } else {
        results.push({ clientEventId: evt.clientEventId, status: 'ALREADY_SYNCED', sequence: existing.sequenceNumber });
      }
    }

    return { ingestedCount: results.length, syncSummary: results };
  }

  async replayEventStream(userId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirstOrThrow({ where: { id: budgetId, userId } });
    const events = await this.prisma.budgetEvent.findMany({
      where: { budgetId },
      orderBy: { sequenceNumber: 'asc' },
    });

    let runningReadyToAssign = DecimalUtil.toDecimal(budget.startingBalance);
    const categoryAllocations = new Map<string, any>();

    for (const evt of events) {
      if (evt.eventType === EventType.ALLOCATE_FUNDS) {
        const payload: any = evt.payload;
        const newAssigned = DecimalUtil.toDecimal(payload.newAssigned);
        const prevAssigned = DecimalUtil.toDecimal(payload.previousAssigned || 0);
        const diff = DecimalUtil.sub(newAssigned, prevAssigned);

        runningReadyToAssign = DecimalUtil.sub(runningReadyToAssign, diff);
        categoryAllocations.set(payload.categoryId, newAssigned);
      } else if (evt.eventType === EventType.TRANSFER_BETWEEN_ENVELOPES) {
        // Zero sum on ready to assign
        const payload: any = evt.payload;
        const transferAmt = DecimalUtil.toDecimal(payload.amount);

        const srcCur = DecimalUtil.toDecimal(categoryAllocations.get(payload.sourceCategoryId) || 0);
        const dstCur = DecimalUtil.toDecimal(categoryAllocations.get(payload.destinationCategoryId) || 0);

        categoryAllocations.set(payload.sourceCategoryId, DecimalUtil.sub(srcCur, transferAmt));
        categoryAllocations.set(payload.destinationCategoryId, DecimalUtil.add(dstCur, transferAmt));
      }
    }

    return {
      budgetId,
      replayedEventsCount: events.length,
      computedReadyToAssign: DecimalUtil.format(runningReadyToAssign),
      envelopesTracked: categoryAllocations.size,
    };
  }
}
