import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LotStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface ApplySplitDto {
  symbol: string;
  splitRatio: number; // e.g., 2 for 2-for-1 forward split
}

@Injectable()
export class CorporateActionsService {
  constructor(private readonly prisma: PrismaService) {}

  async applyStockSplit(dto: ApplySplitDto) {
    const security = await this.prisma.security.findUnique({
      where: { symbol: dto.symbol.toUpperCase() },
    });
    if (!security) throw new NotFoundException(`Security ${dto.symbol} not found`);

    const ratio = new Decimal(dto.splitRatio);

    return this.prisma.$transaction(async (tx) => {
      // 1. Adjust all open/partially-closed TaxLots:
      // Shares are multiplied by splitRatio, cost basis per share is divided by splitRatio
      // Total cost basis remains constant.
      const lots = await tx.taxLot.findMany({
        where: {
          securityId: security.id,
          status: { in: [LotStatus.OPEN, LotStatus.PARTIALLY_CLOSED] },
        },
      });

      for (const lot of lots) {
        const origShares = new Decimal(lot.originalShares.toString()).times(ratio);
        const remShares = new Decimal(lot.remainingShares.toString()).times(ratio);
        const newCostPerShare = new Decimal(lot.costBasisPerShare.toString()).dividedBy(ratio);

        await tx.taxLot.update({
          where: { id: lot.id },
          data: {
            originalShares: origShares,
            remainingShares: remShares,
            costBasisPerShare: newCostPerShare,
          },
        });
      }

      // 2. Adjust active Positions
      const positions = await tx.position.findMany({
        where: { securityId: security.id },
      });

      for (const pos of positions) {
        const newTotalShares = new Decimal(pos.totalShares.toString()).times(ratio);
        const newAvgCost = new Decimal(pos.averageCostPerShare.toString()).dividedBy(ratio);

        await tx.position.update({
          where: { id: pos.id },
          data: {
            totalShares: newTotalShares,
            averageCostPerShare: newAvgCost,
          },
        });
      }

      // 3. Adjust current price of security
      const newCurrentPrice = new Decimal(security.currentPrice.toString()).dividedBy(ratio);
      await tx.security.update({
        where: { id: security.id },
        data: { currentPrice: newCurrentPrice },
      });

      return {
        symbol: security.symbol,
        splitRatio: dto.splitRatio,
        affectedLots: lots.length,
        affectedPositions: positions.length,
      };
    });
  }
}
