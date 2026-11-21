import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockDecimalUtil } from '../../common/decimal.util';
import { TradeType, LotStatus, CapitalGainTerm } from '@prisma/client';
import Decimal from 'decimal.js';

export interface ExecuteTradeDto {
  symbol: string;
  tradeType: TradeType;
  shares: string;
  pricePerShare: string;
  commission?: string;
  transactedAt?: string;
}

@Injectable()
export class TaxLotsService {
  constructor(private readonly prisma: PrismaService) {}

  async executeTrade(userId: string, accountId: string, dto: ExecuteTradeDto) {
    const account = await this.prisma.investmentAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException('Access denied');

    const security = await this.prisma.security.findUnique({
      where: { symbol: dto.symbol.toUpperCase() },
    });
    if (!security) throw new NotFoundException(`Security ${dto.symbol} not found`);

    const shares = new Decimal(dto.shares);
    const price = new Decimal(dto.pricePerShare);
    const comm = dto.commission ? new Decimal(dto.commission) : new Decimal(0);
    const tradeDate = dto.transactedAt ? new Date(dto.transactedAt) : new Date();

    if (shares.lessThanOrEqualTo(0) || price.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Shares and price must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      const grossAmount = shares.times(price);
      const netAmount = dto.tradeType === TradeType.BUY ? grossAmount.plus(comm) : grossAmount.minus(comm);

      // 1. Create trade transaction
      const tradeTx = await tx.tradeTransaction.create({
        data: {
          accountId,
          securityId: security.id,
          tradeType: dto.tradeType,
          shares,
          pricePerShare: price,
          grossAmount,
          commission: comm,
          netAmount,
          transactedAt: tradeDate,
        },
      });

      if (dto.tradeType === TradeType.BUY) {
        // Create new TaxLot
        await tx.taxLot.create({
          data: {
            accountId,
            securityId: security.id,
            originalShares: shares,
            remainingShares: shares,
            costBasisPerShare: price,
            totalCostBasis: grossAmount,
            acquiredDate: tradeDate,
            status: LotStatus.OPEN,
          },
        });

        // Upsert Position
        const existingPos = await tx.position.findUnique({
          where: { accountId_securityId: { accountId, securityId: security.id } },
        });

        if (!existingPos) {
          await tx.position.create({
            data: {
              accountId,
              securityId: security.id,
              totalShares: shares,
              averageCostPerShare: price,
              totalCostBasis: grossAmount,
            },
          });
        } else {
          const newTotalShares = new Decimal(existingPos.totalShares.toString()).plus(shares);
          const newTotalCost = new Decimal(existingPos.totalCostBasis.toString()).plus(grossAmount);
          const newAvgPrice = newTotalCost.dividedBy(newTotalShares);

          await tx.position.update({
            where: { id: existingPos.id },
            data: {
              totalShares: newTotalShares,
              totalCostBasis: newTotalCost,
              averageCostPerShare: newAvgPrice,
            },
          });
        }
      } else if (dto.tradeType === TradeType.SELL) {
        // FIFO Liquidation
        const openLots = await tx.taxLot.findMany({
          where: {
            accountId,
            securityId: security.id,
            status: { in: [LotStatus.OPEN, LotStatus.PARTIALLY_CLOSED] },
          },
          orderBy: { acquiredDate: 'asc' }, // FIFO
        });

        let remainingToSell = shares;
        const closedSales = [];

        for (const lot of openLots) {
          if (remainingToSell.isZero()) break;

          const lotShares = new Decimal(lot.remainingShares.toString());
          const sharesFromThisLot = Decimal.min(remainingToSell, lotShares);

          const lotCostBasis = sharesFromThisLot.times(new Decimal(lot.costBasisPerShare.toString()));
          const lotProceeds = sharesFromThisLot.times(price);
          const realizedGain = lotProceeds.minus(lotCostBasis);

          const daysHeld = Math.floor(
            (tradeDate.getTime() - new Date(lot.acquiredDate).getTime()) / (24 * 60 * 60 * 1000),
          );
          const term = daysHeld >= 365 ? CapitalGainTerm.LONG_TERM : CapitalGainTerm.SHORT_TERM;

          // Record closed lot sale
          await tx.closedLotSale.create({
            data: {
              transactionId: tradeTx.id,
              taxLotId: lot.id,
              sharesSold: sharesFromThisLot,
              costBasis: lotCostBasis,
              proceeds: lotProceeds,
              realizedGain,
              term,
              soldAt: tradeDate,
            },
          });

          // Update lot
          const newLotRemaining = lotShares.minus(sharesFromThisLot);
          await tx.taxLot.update({
            where: { id: lot.id },
            data: {
              remainingShares: newLotRemaining,
              status: newLotRemaining.isZero() ? LotStatus.CLOSED : LotStatus.PARTIALLY_CLOSED,
            },
          });

          remainingToSell = remainingToSell.minus(sharesFromThisLot);
        }

        if (remainingToSell.greaterThan(0)) {
          throw new BadRequestException(
            `Insufficient shares to sell. Remaining unfulfilled shares: ${remainingToSell.toString()}`,
          );
        }

        // Update Position
        const existingPos = await tx.position.findUniqueOrThrow({
          where: { accountId_securityId: { accountId, securityId: security.id } },
        });

        const updatedShares = new Decimal(existingPos.totalShares.toString()).minus(shares);
        if (updatedShares.isZero()) {
          await tx.position.delete({ where: { id: existingPos.id } });
        } else {
          const avgCost = new Decimal(existingPos.averageCostPerShare.toString());
          const updatedCost = updatedShares.times(avgCost);
          await tx.position.update({
            where: { id: existingPos.id },
            data: {
              totalShares: updatedShares,
              totalCostBasis: updatedCost,
            },
          });
        }
      }

      return tradeTx;
    });
  }

  async listTaxLots(userId: string, accountId: string) {
    const account = await this.prisma.investmentAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== userId) throw new ForbiddenException('Access denied');

    const lots = await this.prisma.taxLot.findMany({
      where: { accountId, status: { in: [LotStatus.OPEN, LotStatus.PARTIALLY_CLOSED] } },
      include: { security: true },
      orderBy: { acquiredDate: 'asc' },
    });

    return lots.map((l) => {
      const remaining = new Decimal(l.remainingShares.toString());
      const costPerShare = new Decimal(l.costBasisPerShare.toString());
      const currentPrice = new Decimal(l.security.currentPrice.toString());
      const curVal = remaining.times(currentPrice);
      const costBasis = remaining.times(costPerShare);
      const unrealized = curVal.minus(costBasis);

      return {
        id: l.id,
        symbol: l.security.symbol,
        name: l.security.name,
        remainingShares: StockDecimalUtil.formatShares(remaining),
        costBasisPerShare: StockDecimalUtil.formatPrice(costPerShare),
        currentPrice: StockDecimalUtil.formatPrice(currentPrice),
        currentValuation: StockDecimalUtil.formatPrice(curVal),
        costBasis: StockDecimalUtil.formatPrice(costBasis),
        unrealizedGain: StockDecimalUtil.formatPrice(unrealized),
        acquiredDate: l.acquiredDate,
        status: l.status,
      };
    });
  }

  async listRealizedGains(userId: string, accountId: string) {
    const account = await this.prisma.investmentAccount.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.closedLotSale.findMany({
      where: { taxLot: { accountId } },
      include: {
        taxLot: { include: { security: true } },
      },
      orderBy: { soldAt: 'desc' },
    });
  }
}
