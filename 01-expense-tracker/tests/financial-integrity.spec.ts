import { Decimal, DecimalUtil } from '../backend/src/common/decimal.util';

describe('Financial Arithmetic & Decimal Precision Tests', () => {
  it('should accurately compute 0.1 + 0.2 without binary floating-point drift', () => {
    const jsNativeFloat = 0.1 + 0.2;
    expect(jsNativeFloat).not.toBe(0.3); // 0.30000000000000004 in native float

    const safeDecimalSum = DecimalUtil.add('0.1', '0.2');
    expect(safeDecimalSum.toString()).toBe('0.3');
    expect(DecimalUtil.format(safeDecimalSum, 2)).toBe('0.30');
  });

  it('should preserve multi-step precision without intermediate rounding drift', () => {
    // Calculating tax and discount across multiple operations
    const subtotal = new Decimal('149.99');
    const taxRate = new Decimal('0.0825'); // 8.25%
    const discountRate = new Decimal('0.15'); // 15%

    const discountAmount = DecimalUtil.round(DecimalUtil.mul(subtotal, discountRate), 2);
    const discountedSubtotal = DecimalUtil.sub(subtotal, discountAmount);
    const taxAmount = DecimalUtil.round(DecimalUtil.mul(discountedSubtotal, taxRate), 2);
    const grandTotal = DecimalUtil.add(discountedSubtotal, taxAmount);

    expect(DecimalUtil.format(discountAmount, 2)).toBe('22.50');
    expect(DecimalUtil.format(discountedSubtotal, 2)).toBe('127.49');
    expect(DecimalUtil.format(taxAmount, 2)).toBe('10.52');
    expect(DecimalUtil.format(grandTotal, 2)).toBe('138.01');
  });

  it('should guard against division by zero in financial calculations', () => {
    expect(() => {
      DecimalUtil.div('100.00', '0.00');
    }).toThrow('Division by zero in financial arithmetic');
  });

  it('should strictly round half up according to financial standards', () => {
    expect(DecimalUtil.round('2.555', 2).toString()).toBe('2.56');
    expect(DecimalUtil.round('2.554', 2).toString()).toBe('2.55');
    expect(DecimalUtil.round('2.550', 2).toString()).toBe('2.55');
  });

  it('should handle large balances up to NUMERIC(15,2) without overflow', () => {
    const largeBalance = new Decimal('9999999999999.99');
    const addition = new Decimal('0.01');
    const result = DecimalUtil.add(largeBalance, addition);
    expect(result.toString()).toBe('10000000000000');
  });
});
