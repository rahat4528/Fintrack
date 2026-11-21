import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockDecimalUtil } from '../../common/decimal.util';
import Decimal from 'decimal.js';

export interface RebalanceRecommendation {
  sector: string;
  currentValue: string;
  currentWeightPercent: string;
  targetWeightPercent: string;
  targetValue: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  adjustmentAmount: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateRebalancing(userId: string, accountId: string) {
    const account = await this.prisma.investmentAccount.findUnique({
      where: { id: accountId },
      include: {
        positions: {
          include: { security: true },
        },
      },
    });

    if (!account) throw new NotFoundException('Account not found');

    const targets = await this.prisma.targetAllocation.findMany({ where: { userId } });
    const targetMap = new Map(targets.map((t) => [t.sector, new Decimal(t.targetPercent.toString())]));

    // Compute current sector valuations
    const sectorValues = new Map<string, Decimal>();
    let totalPortfolioValue = new Decimal(account.cashBalance.toString());

    for (const pos of account.positions) {
      const shares = new Decimal(pos.totalShares.toString());
      const price = new Decimal(pos.security.currentPrice.toString());
      const val = shares.times(price);

      totalPortfolioValue = totalPortfolioValue.plus(val);
      const existingSectorVal = sectorValues.get(pos.security.sector) || new Decimal(0);
      sectorValues.set(pos.security.sector, existingSectorVal.plus(val));
    }

    const recommendations: RebalanceRecommendation[] = [];

    // Distinct sectors
    const allSectors = Array.from(
      new Set([...Array.from(targetMap.keys()), ...Array.from(sectorValues.keys())]),
    );

    for (const sector of allSectors) {
      const curVal = sectorValues.get(sector) || new Decimal(0);
      const targetPct = targetMap.get(sector) || new Decimal(0);
      const curPct = totalPortfolioValue.isZero()
        ? new Decimal(0)
        : curVal.dividedBy(totalPortfolioValue).times(100);

      const targetVal = totalPortfolioValue.times(targetPct.dividedBy(100));
      const diff = targetVal.minus(curVal);

      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (diff.greaterThan(50)) action = 'BUY';
      else if (diff.lessThan(-50)) action = 'SELL';

      recommendations.push({
        sector,
        currentValue: StockDecimalUtil.formatPrice(curVal),
        currentWeightPercent: StockDecimalUtil.formatPrice(curPct, 2),
        targetWeightPercent: StockDecimalUtil.formatPrice(targetPct, 2),
        targetValue: StockDecimalUtil.formatPrice(targetVal),
        action,
        adjustmentAmount: StockDecimalUtil.formatPrice(diff.abs()),
      });
    }

    return {
      totalPortfolioValue: StockDecimalUtil.formatPrice(totalPortfolioValue),
      cashBalance: StockDecimalUtil.formatPrice(account.cashBalance),
      recommendations,
    };
  }

  // Pure function for XIRR computation
  public static calculateXIRR(cashflows: Array<{ date: Date; amount: number }>): number {
    // Newton-Raphson method for internal rate of return
    let rate = 0.1; // Initial guess 10%
    const maxIterations = 100;
    const tolerance = 1e-6;

    const startDate = cashflows[0].date.getTime();

    for (let i = 0; i < maxIterations; i++) {
      let fValue = 0;
      let fDerivative = 0;

      for (const cf of cashflows) {
        const years = (cf.date.getTime() - startDate) / (365 * 24 * 60 * 60 * 1000);
        const factor = Math.pow(1 + rate, years);
        fValue += cf.amount / factor;
        fDerivative -= (years * cf.amount) / Math.pow(1 + rate, years + 1);
      }

      if (Math.abs(fDerivative) < 1e-12) break;
      const newRate = rate - fValue / fDerivative;
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate;
      }
      rate = newRate;
    }

    return rate;
  }
}
