import { Decimal, StockDecimalUtil } from '../backend/src/common/decimal.util';
import { AnalyticsService } from '../backend/src/modules/analytics/analytics.service';
import { CapitalGainTerm, LotStatus } from '@prisma/client';

describe('Phase 6: Stock Market Portfolio Tracker - Tax-Lot Accounting & Invariants', () => {
  describe('FIFO Tax-Lot Liquidation and Capital Gains Invariant', () => {
    it('exhausts oldest tax lots first (FIFO) and separates short-term vs long-term capital gains', () => {
      // Lot 1: 50 shares @ $150.00 acquired 420 days ago (Long-Term)
      // Lot 2: 30 shares @ $175.00 acquired 90 days ago (Short-Term)
      interface MockLot {
        id: string;
        shares: Decimal;
        costPerShare: Decimal;
        daysHeld: number;
      }

      const lots: MockLot[] = [
        { id: 'LOT-1', shares: new Decimal('50.0'), costPerShare: new Decimal('150.00'), daysHeld: 420 },
        { id: 'LOT-2', shares: new Decimal('30.0'), costPerShare: new Decimal('175.00'), daysHeld: 90 },
      ];

      // Order to SELL 60 shares @ $190.00
      let remainingToSell = new Decimal('60.0');
      const salePrice = new Decimal('190.00');

      let shortTermGain = new Decimal(0);
      let longTermGain = new Decimal(0);
      let totalCostOfSold = new Decimal(0);
      let totalProceeds = new Decimal(0);

      for (const lot of lots) {
        if (remainingToSell.isZero()) break;

        const sharesSoldFromLot = Decimal.min(remainingToSell, lot.shares);
        const lotCost = sharesSoldFromLot.times(lot.costPerShare);
        const lotProceeds = sharesSoldFromLot.times(salePrice);
        const gain = lotProceeds.minus(lotCost);

        totalCostOfSold = totalCostOfSold.plus(lotCost);
        totalProceeds = totalProceeds.plus(lotProceeds);

        if (lot.daysHeld >= 365) {
          longTermGain = longTermGain.plus(gain);
        } else {
          shortTermGain = shortTermGain.plus(gain);
        }

        lot.shares = lot.shares.minus(sharesSoldFromLot);
        remainingToSell = remainingToSell.minus(sharesSoldFromLot);
      }

      // Verification:
      // Lot 1 fully liquidated (50 shares): proceeds 50 * 190 = 9500, cost 50 * 150 = 7500 -> Long-Term Gain = 2,000.00
      // Lot 2 partially liquidated (10 shares): proceeds 10 * 190 = 1900, cost 10 * 175 = 1750 -> Short-Term Gain = 150.00
      // Remaining shares in Lot 2: 20 shares @ $175.00
      expect(StockDecimalUtil.formatPrice(longTermGain, 2)).toBe('2000.00');
      expect(StockDecimalUtil.formatPrice(shortTermGain, 2)).toBe('150.00');
      expect(StockDecimalUtil.formatPrice(totalProceeds, 2)).toBe('11400.00');
      expect(StockDecimalUtil.formatPrice(totalCostOfSold, 2)).toBe('9250.00');

      expect(lots[0].shares.isZero()).toBe(true);
      expect(lots[1].shares.toFixed(1)).toBe('20.0');
      expect(StockDecimalUtil.formatPrice(lots[1].shares.times(lots[1].costPerShare), 2)).toBe('3500.00');
    });
  });

  describe('Corporate Action Stock Split Invariant', () => {
    it('conserves total invested cost basis to the cent under forward stock split', () => {
      // 40 shares @ $350.00 = $14,000.00 total cost basis
      const initialShares = new Decimal('40.000000');
      const initialCostPerShare = new Decimal('350.0000');
      const initialTotalCost = initialShares.times(initialCostPerShare);

      // 2-for-1 forward split
      const splitRatio = new Decimal('2');

      const splitShares = initialShares.times(splitRatio); // 80 shares
      const splitCostPerShare = initialCostPerShare.dividedBy(splitRatio); // $175.0000
      const splitTotalCost = splitShares.times(splitCostPerShare);

      expect(splitShares.toFixed(1)).toBe('80.0');
      expect(StockDecimalUtil.formatPrice(splitCostPerShare, 2)).toBe('175.00');
      expect(StockDecimalUtil.formatPrice(splitTotalCost, 2)).toBe('14000.00');
      expect(initialTotalCost.minus(splitTotalCost).isZero()).toBe(true);
    });
  });

  describe('Internal Rate of Return (XIRR) Engine', () => {
    it('solves exact annualized money-weighted return for cashflow streams', () => {
      const dayMs = 24 * 60 * 60 * 1000;
      const baseDate = new Date('2025-01-01');

      // Cash outflow $10,000 at day 0, cash inflow $11,500 at day 365 (exactly 15% return)
      const cashflows = [
        { date: baseDate, amount: -10000 },
        { date: new Date(baseDate.getTime() + 365 * dayMs), amount: 11500 },
      ];

      const xirr = AnalyticsService.calculateXIRR(cashflows);
      const xirrPercent = (xirr * 100).toFixed(2);

      expect(xirrPercent).toBe('15.00');
    });
  });

  describe('Portfolio Rebalancing Engine', () => {
    it('calculates dollar rebalancing requirements to realign with target allocations', () => {
      const totalPortfolio = new Decimal('100000.00');

      const allocations = [
        { sector: 'Technology', curVal: new Decimal('50000.00'), targetPct: new Decimal('40.00') },
        { sector: 'Healthcare', curVal: new Decimal('10000.00'), targetPct: new Decimal('20.00') },
      ];

      // Tech target: $40,000. Current: $50,000 -> Overweight by $10,000 (SELL)
      // Health target: $20,000. Current: $10,000 -> Underweight by $10,000 (BUY)
      const techTargetVal = totalPortfolio.times(allocations[0].targetPct.dividedBy(100));
      const techDiff = techTargetVal.minus(allocations[0].curVal);

      const healthTargetVal = totalPortfolio.times(allocations[1].targetPct.dividedBy(100));
      const healthDiff = healthTargetVal.minus(allocations[1].curVal);

      expect(StockDecimalUtil.formatPrice(techDiff, 2)).toBe('-10000.00');
      expect(StockDecimalUtil.formatPrice(healthDiff, 2)).toBe('10000.00');
    });
  });
});
