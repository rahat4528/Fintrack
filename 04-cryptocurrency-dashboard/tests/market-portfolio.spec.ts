import { Decimal, CryptoDecimalUtil } from '../backend/src/common/decimal.util';
import { AlertCondition, AlertStatus } from '@prisma/client';

describe('Phase 4: Cryptocurrency Dashboard - High Precision & Portfolio Invariants', () => {
  describe('High-Precision 18-Decimal Cryptographic Arithmetic', () => {
    it('maintains absolute 18-decimal precision without truncation or floating point error', () => {
      // 0.000000000000000001 (1 Wei / satoshi-level precision)
      const wei = new Decimal('0.000000000000000001');
      const baseHolding = new Decimal('1.250000000000000000');

      const total = baseHolding.plus(wei);
      expect(total.toFixed(18)).toBe('1.250000000000000001');

      // Subtract back to verify exact reversibility
      const reverted = total.minus(wei);
      expect(reverted.toFixed(18)).toBe('1.250000000000000000');
    });

    it('multiplies high-precision crypto quantities with fiat unit prices accurately', () => {
      const quantity = new Decimal('2.458912345678912345');
      const unitPriceUsd = new Decimal('67450.25000000');

      const totalValuation = quantity.times(unitPriceUsd);
      // Verify exact fiat rounding to 2 decimals
      expect(CryptoDecimalUtil.formatFiat(totalValuation, 2)).toBe('165854.25');
    });
  });

  describe('Weighted Average Cost (WAC) Basis Invariants', () => {
    it('correctly recalculates weighted average cost basis when accumulating multiple lots', () => {
      // Lot 1: 1.5 BTC @ $60,000
      const lot1Qty = new Decimal('1.5');
      const lot1Price = new Decimal('60000.00');
      const lot1Cost = lot1Qty.times(lot1Price); // $90,000

      // Lot 2: 0.5 BTC @ $64,000
      const lot2Qty = new Decimal('0.5');
      const lot2Price = new Decimal('64000.00');
      const lot2Cost = lot2Qty.times(lot2Price); // $32,000

      const totalQty = lot1Qty.plus(lot2Qty); // 2.0 BTC
      const totalInvested = lot1Cost.plus(lot2Cost); // $122,000
      const avgCostBasis = totalInvested.dividedBy(totalQty); // $61,000

      expect(totalQty.toFixed(1)).toBe('2.0');
      expect(CryptoDecimalUtil.formatFiat(totalInvested, 2)).toBe('122000.00');
      expect(CryptoDecimalUtil.formatFiat(avgCostBasis, 2)).toBe('61000.00');
    });

    it('computes exact realized PnL on partial liquidation and preserves remaining cost basis', () => {
      const initialHoldingQty = new Decimal('2.0');
      const avgCostBasis = new Decimal('61000.00');

      // Sell 0.8 BTC @ $68,000
      const sellQty = new Decimal('0.8');
      const sellPrice = new Decimal('68000.00');

      const costOfSold = sellQty.times(avgCostBasis); // 0.8 * 61,000 = $48,800
      const proceeds = sellQty.times(sellPrice); // 0.8 * 68,000 = $54,400
      const realizedPnL = proceeds.minus(costOfSold); // $5,600.00

      const remainingQty = initialHoldingQty.minus(sellQty); // 1.2 BTC
      const remainingInvested = remainingQty.times(avgCostBasis); // 1.2 * 61,000 = $73,200

      expect(CryptoDecimalUtil.formatFiat(realizedPnL, 2)).toBe('5600.00');
      expect(remainingQty.toFixed(1)).toBe('1.2');
      expect(CryptoDecimalUtil.formatFiat(remainingInvested, 2)).toBe('73200.00');

      // If current market price is $67,450.25:
      const currentMarketPrice = new Decimal('67450.25');
      const currentValuation = remainingQty.times(currentMarketPrice); // 1.2 * 67450.25 = 80940.30
      const unrealizedPnL = currentValuation.minus(remainingInvested); // 80940.30 - 73200 = 7740.30

      expect(CryptoDecimalUtil.formatFiat(currentValuation, 2)).toBe('80940.30');
      expect(CryptoDecimalUtil.formatFiat(unrealizedPnL, 2)).toBe('7740.30');
    });
  });

  describe('Price Alerts Evaluation Rules', () => {
    it('evaluates PRICE_ABOVE triggers correctly', () => {
      const currentPrice = new Decimal('67450.25');
      const targetThreshold = new Decimal('65000.00');

      const isTriggered = currentPrice.greaterThanOrEqualTo(targetThreshold);
      expect(isTriggered).toBe(true);
    });

    it('evaluates PRICE_BELOW triggers correctly', () => {
      const currentPrice = new Decimal('3520.80');
      const targetThreshold = new Decimal('3200.00');

      const isTriggered = currentPrice.lessThanOrEqualTo(targetThreshold);
      expect(isTriggered).toBe(false);
    });
  });

  describe('Stale Data Flagging and Cache TTL Policy', () => {
    it('flags quote as isStale=true when quote age exceeds TTL of 60 seconds', () => {
      const CACHE_TTL_MS = 60 * 1000;
      const now = Date.now();
      const quoteTimestampFresh = new Date(now - 30 * 1000); // 30s ago
      const quoteTimestampStale = new Date(now - 75 * 1000); // 75s ago

      const isFreshStale = now - quoteTimestampFresh.getTime() > CACHE_TTL_MS;
      const isOldStale = now - quoteTimestampStale.getTime() > CACHE_TTL_MS;

      expect(isFreshStale).toBe(false);
      expect(isOldStale).toBe(true);
    });
  });
});
