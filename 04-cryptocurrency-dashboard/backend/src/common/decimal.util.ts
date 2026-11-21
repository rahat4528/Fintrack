import Decimal from 'decimal.js';

export { Decimal };

// Precision up to 38 decimal places for crypto satoshis/wei
Decimal.set({ precision: 38, rounding: Decimal.ROUND_HALF_UP });

export class CryptoDecimalUtil {
  public static toDecimal(val: string | number | Decimal | null | undefined): Decimal {
    if (val === null || val === undefined) return new Decimal(0);
    if (val instanceof Decimal) return val;
    return new Decimal(val);
  }

  public static add(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return this.toDecimal(a).plus(this.toDecimal(b));
  }

  public static sub(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return this.toDecimal(a).minus(this.toDecimal(b));
  }

  public static mul(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    return this.toDecimal(a).times(this.toDecimal(b));
  }

  public static div(a: string | number | Decimal, b: string | number | Decimal): Decimal {
    const divisor = this.toDecimal(b);
    if (divisor.isZero()) throw new Error('Division by zero in crypto calculation');
    return this.toDecimal(a).dividedBy(divisor);
  }

  public static formatCrypto(val: string | number | Decimal, decimals = 8): string {
    return this.toDecimal(val).toFixed(decimals);
  }

  public static formatFiat(val: string | number | Decimal, decimals = 2): string {
    return this.toDecimal(val).toFixed(decimals);
  }

  public static toPrisma(val: string | number | Decimal): Decimal {
    return this.toDecimal(val);
  }
}
