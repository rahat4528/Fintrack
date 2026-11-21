import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { CryptoDecimalUtil } from '../../common/decimal.util';
import { TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

export interface CreatePortfolioDto {
  name: string;
  description?: string;
  currency?: string;
}

export interface AddTransactionDto {
  symbol: string;
  type: TransactionType;
  quantity: string;
  unitPriceUsd: string;
  feeUsd?: string;
  notes?: string;
  transactedAt?: string;
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async listUserPortfolios(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          include: { asset: true },
        },
      },
    });

    const tickers = await this.marketService.getAllTickers();
    const tickerMap = new Map(tickers.map((t) => [t.symbol, new Decimal(t.priceUsd)]));

    return portfolios.map((p) => {
      let totalCurrentValue = new Decimal(0);
      let totalInvestedCost = new Decimal(0);
      let totalRealizedPnL = new Decimal(0);

      for (const h of p.holdings) {
        const qty = new Decimal(h.quantity.toString());
        const invested = new Decimal(h.totalInvestedUsd.toString());
        const currentPrice = tickerMap.get(h.asset.symbol) || new Decimal(h.averageCostBasisUsd.toString());
        const currentValue = qty.times(currentPrice);

        totalCurrentValue = totalCurrentValue.plus(currentValue);
        totalInvestedCost = totalInvestedCost.plus(invested);
        totalRealizedPnL = totalRealizedPnL.plus(new Decimal(h.realizedPnLUsd.toString()));
      }

      const totalUnrealizedPnL = totalCurrentValue.minus(totalInvestedCost);
      const unrealizedPnLPercent = totalInvestedCost.isZero()
        ? '0.00'
        : totalUnrealizedPnL.dividedBy(totalInvestedCost).times(100).toFixed(2);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        currency: p.currency,
        holdingsCount: p.holdings.length,
        totalCurrentValueUsd: CryptoDecimalUtil.formatFiat(totalCurrentValue, 2),
        totalInvestedCostUsd: CryptoDecimalUtil.formatFiat(totalInvestedCost, 2),
        totalUnrealizedPnLUsd: CryptoDecimalUtil.formatFiat(totalUnrealizedPnL, 2),
        unrealizedPnLPercent,
        totalRealizedPnLUsd: CryptoDecimalUtil.formatFiat(totalRealizedPnL, 2),
      };
    });
  }

  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    return this.prisma.portfolio.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        currency: dto.currency || 'USD',
      },
    });
  }

  async getPortfolioDetails(userId: string, portfolioId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        holdings: {
          include: { asset: true },
        },
        transactions: {
          include: { asset: true },
          orderBy: { transactedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!portfolio) throw new NotFoundException('Portfolio not found');
    if (portfolio.userId !== userId) throw new ForbiddenException('Access denied');

    const tickers = await this.marketService.getAllTickers();
    const tickerMap = new Map(tickers.map((t) => [t.symbol, new Decimal(t.priceUsd)]));

    let totalValuation = new Decimal(0);
    let totalInvested = new Decimal(0);

    const detailedHoldings = portfolio.holdings.map((h) => {
      const qty = new Decimal(h.quantity.toString());
      const avgCost = new Decimal(h.averageCostBasisUsd.toString());
      const invested = new Decimal(h.totalInvestedUsd.toString());
      const currentPrice = tickerMap.get(h.asset.symbol) || avgCost;
      const currentVal = qty.times(currentPrice);
      const unrealizedPnL = currentVal.minus(invested);
      const unrealizedPnLPercent = invested.isZero()
        ? '0.00'
        : unrealizedPnL.dividedBy(invested).times(100).toFixed(2);

      totalValuation = totalValuation.plus(currentVal);
      totalInvested = totalInvested.plus(invested);

      return {
        id: h.id,
        symbol: h.asset.symbol,
        name: h.asset.name,
        quantity: CryptoDecimalUtil.formatCrypto(qty, 8),
        averageCostBasisUsd: CryptoDecimalUtil.formatCrypto(avgCost, 4),
        currentPriceUsd: CryptoDecimalUtil.formatCrypto(currentPrice, 4),
        totalInvestedUsd: CryptoDecimalUtil.formatFiat(invested, 2),
        currentValueUsd: CryptoDecimalUtil.formatFiat(currentVal, 2),
        unrealizedPnLUsd: CryptoDecimalUtil.formatFiat(unrealizedPnL, 2),
        unrealizedPnLPercent,
        realizedPnLUsd: CryptoDecimalUtil.formatFiat(h.realizedPnLUsd, 2),
      };
    });

    const totalUnrealized = totalValuation.minus(totalInvested);

    return {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        totalValuationUsd: CryptoDecimalUtil.formatFiat(totalValuation, 2),
        totalInvestedUsd: CryptoDecimalUtil.formatFiat(totalInvested, 2),
        totalUnrealizedPnLUsd: CryptoDecimalUtil.formatFiat(totalUnrealized, 2),
      },
      holdings: detailedHoldings,
      recentTransactions: portfolio.transactions.map((tx) => ({
        id: tx.id,
        symbol: tx.asset.symbol,
        type: tx.type,
        quantity: CryptoDecimalUtil.formatCrypto(tx.quantity, 8),
        unitPriceUsd: CryptoDecimalUtil.formatCrypto(tx.unitPriceUsd, 4),
        totalCostUsd: CryptoDecimalUtil.formatFiat(tx.totalCostUsd, 2),
        feeUsd: CryptoDecimalUtil.formatFiat(tx.feeUsd, 2),
        transactedAt: tx.transactedAt,
      })),
    };
  }

  async addTransaction(userId: string, portfolioId: string, dto: AddTransactionDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { id: portfolioId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');
    if (portfolio.userId !== userId) throw new ForbiddenException('Access denied');

    const asset = await this.prisma.asset.findUnique({
      where: { symbol: dto.symbol.toUpperCase() },
    });
    if (!asset) throw new NotFoundException(`Asset ${dto.symbol} not found`);

    const qty = new Decimal(dto.quantity);
    const unitPrice = new Decimal(dto.unitPriceUsd);
    const fee = dto.feeUsd ? new Decimal(dto.feeUsd) : new Decimal(0);
    const totalCost = qty.times(unitPrice).plus(fee);

    if (qty.isNegative() || qty.isZero()) {
      throw new BadRequestException('Transaction quantity must be positive');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Record the transaction
      const recordedTx = await tx.portfolioTransaction.create({
        data: {
          portfolioId,
          assetId: asset.id,
          type: dto.type,
          quantity: qty,
          unitPriceUsd: unitPrice,
          totalCostUsd: totalCost,
          feeUsd: fee,
          notes: dto.notes,
          transactedAt: dto.transactedAt ? new Date(dto.transactedAt) : new Date(),
        },
      });

      // 2. Update holding based on BUY or SELL
      const existingHolding = await tx.portfolioHolding.findUnique({
        where: {
          portfolioId_assetId: {
            portfolioId,
            assetId: asset.id,
          },
        },
      });

      if (dto.type === TransactionType.BUY) {
        if (!existingHolding) {
          await tx.portfolioHolding.create({
            data: {
              portfolioId,
              assetId: asset.id,
              quantity: qty,
              averageCostBasisUsd: unitPrice,
              totalInvestedUsd: totalCost,
              realizedPnLUsd: new Decimal(0),
            },
          });
        } else {
          const oldQty = new Decimal(existingHolding.quantity.toString());
          const oldInvested = new Decimal(existingHolding.totalInvestedUsd.toString());

          const newQty = oldQty.plus(qty);
          const newInvested = oldInvested.plus(totalCost);
          const newAvgCost = newInvested.dividedBy(newQty);

          await tx.portfolioHolding.update({
            where: { id: existingHolding.id },
            data: {
              quantity: newQty,
              totalInvestedUsd: newInvested,
              averageCostBasisUsd: newAvgCost,
            },
          });
        }
      } else if (dto.type === TransactionType.SELL) {
        if (!existingHolding) {
          throw new BadRequestException(`Cannot sell ${dto.symbol}: no existing holding in portfolio`);
        }

        const currentQty = new Decimal(existingHolding.quantity.toString());
        if (currentQty.lessThan(qty)) {
          throw new BadRequestException(
            `Insufficient holding: Available ${currentQty.toString()} ${dto.symbol}, tried to sell ${qty.toString()}`,
          );
        }

        const avgCost = new Decimal(existingHolding.averageCostBasisUsd.toString());
        const costBasisOfSold = qty.times(avgCost);
        const saleProceeds = qty.times(unitPrice).minus(fee);
        const realizedGain = saleProceeds.minus(costBasisOfSold);

        const remainingQty = currentQty.minus(qty);
        const remainingInvested = remainingQty.times(avgCost);
        const updatedRealizedPnL = new Decimal(existingHolding.realizedPnLUsd.toString()).plus(realizedGain);

        await tx.portfolioHolding.update({
          where: { id: existingHolding.id },
          data: {
            quantity: remainingQty,
            totalInvestedUsd: remainingInvested,
            realizedPnLUsd: updatedRealizedPnL,
          },
        });
      }

      return recordedTx;
    });
  }
}
