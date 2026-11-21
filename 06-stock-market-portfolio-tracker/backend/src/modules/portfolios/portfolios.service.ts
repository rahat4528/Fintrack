import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockDecimalUtil } from '../../common/decimal.util';
import Decimal from 'decimal.js';

@Injectable()
export class PortfoliosService {
  constructor(private readonly prisma: PrismaService) {}

  async listUserAccounts(userId: string) {
    const accounts = await this.prisma.investmentAccount.findMany({
      where: { userId },
      include: {
        positions: {
          include: { security: true },
        },
      },
    });

    return accounts.map((acc) => {
      let totalStockValue = new Decimal(0);
      let totalCostBasis = new Decimal(0);

      for (const pos of acc.positions) {
        const shares = new Decimal(pos.totalShares.toString());
        const curPrice = new Decimal(pos.security.currentPrice.toString());
        const costBasis = new Decimal(pos.totalCostBasis.toString());

        totalStockValue = totalStockValue.plus(shares.times(curPrice));
        totalCostBasis = totalCostBasis.plus(costBasis);
      }

      const cash = new Decimal(acc.cashBalance.toString());
      const totalPortfolioValuation = totalStockValue.plus(cash);
      const unrealizedGain = totalStockValue.minus(totalCostBasis);
      const unrealizedGainPercent = totalCostBasis.isZero()
        ? '0.00'
        : unrealizedGain.dividedBy(totalCostBasis).times(100).toFixed(2);

      return {
        id: acc.id,
        accountName: acc.accountName,
        category: acc.category,
        currency: acc.currency,
        cashBalance: StockDecimalUtil.formatPrice(cash),
        stockValuation: StockDecimalUtil.formatPrice(totalStockValue),
        totalValuation: StockDecimalUtil.formatPrice(totalPortfolioValuation),
        totalCostBasis: StockDecimalUtil.formatPrice(totalCostBasis),
        unrealizedGain: StockDecimalUtil.formatPrice(unrealizedGain),
        unrealizedGainPercent,
        positionsCount: acc.positions.length,
      };
    });
  }

  async getAccountDetails(userId: string, accountId: string) {
    const account = await this.prisma.investmentAccount.findUnique({
      where: { id: accountId },
      include: {
        positions: {
          include: { security: true },
        },
        transactions: {
          include: { security: true },
          orderBy: { transactedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId) throw new ForbiddenException('Access denied');

    const positions = account.positions.map((pos) => {
      const shares = new Decimal(pos.totalShares.toString());
      const curPrice = new Decimal(pos.security.currentPrice.toString());
      const costBasis = new Decimal(pos.totalCostBasis.toString());
      const avgPrice = new Decimal(pos.averageCostPerShare.toString());
      const curValuation = shares.times(curPrice);
      const unrealized = curValuation.minus(costBasis);
      const unrealizedPct = costBasis.isZero()
        ? '0.00'
        : unrealized.dividedBy(costBasis).times(100).toFixed(2);

      return {
        id: pos.id,
        symbol: pos.security.symbol,
        name: pos.security.name,
        sector: pos.security.sector,
        totalShares: StockDecimalUtil.formatShares(shares),
        averageCostPerShare: StockDecimalUtil.formatPrice(avgPrice),
        currentPrice: StockDecimalUtil.formatPrice(curPrice),
        totalCostBasis: StockDecimalUtil.formatPrice(costBasis),
        currentValuation: StockDecimalUtil.formatPrice(curValuation),
        unrealizedGain: StockDecimalUtil.formatPrice(unrealized),
        unrealizedGainPercent: unrealizedPct,
      };
    });

    return {
      account: {
        id: account.id,
        accountName: account.accountName,
        category: account.category,
        cashBalance: StockDecimalUtil.formatPrice(account.cashBalance),
      },
      positions,
      recentTrades: account.transactions.map((tx) => ({
        id: tx.id,
        symbol: tx.security.symbol,
        tradeType: tx.tradeType,
        shares: StockDecimalUtil.formatShares(tx.shares),
        pricePerShare: StockDecimalUtil.formatPrice(tx.pricePerShare),
        netAmount: StockDecimalUtil.formatPrice(tx.netAmount),
        transactedAt: tx.transactedAt,
      })),
    };
  }
}
