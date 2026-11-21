import Decimal from 'decimal.js';

export { Decimal };

// Configure high precision for financial safety
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export class DecimalUtil {
  public static toDecimal(val: string | number | Decimal | null | undefined): Decimal {
    if (val === null || val === undefined) {
      return new Decimal(0);
    }
    if (val instanceof Decimal) {
      return val;
    }
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
    if (divisor.isZero()) {
      throw new Error('Division by zero in financial arithmetic');
    }
    return this.toDecimal(a).dividedBy(divisor);
  }

  public static round(val: string | number | Decimal, decimalPlaces = 2): Decimal {
    return this.toDecimal(val).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
  }

  public static equals(a: string | number | Decimal, b: string | number | Decimal): boolean {
    return this.toDecimal(a).equals(this.toDecimal(b));
  }

  public static isZero(val: string | number | Decimal): boolean {
    return this.toDecimal(val).isZero();
  }

  public static isPositive(val: string | number | Decimal): boolean {
    return this.toDecimal(val).isPositive() && !this.toDecimal(val).isZero();
  }

  public static isNegative(val: string | number | Decimal): boolean {
    return this.toDecimal(val).isNegative();
  }

  public static format(val: string | number | Decimal, decimalPlaces = 2): string {
    return this.toDecimal(val).toFixed(decimalPlaces);
  }
}
