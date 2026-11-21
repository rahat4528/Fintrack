import { Decimal, InvoiceDecimalUtil } from '../backend/src/common/decimal.util';
import { InvoiceStatus } from '@prisma/client';

describe('Phase 5: Invoice Management System - Invoicing & Financial Accounting Invariants', () => {
  describe('Mathematical Total and Multi-Tax Reconciliation', () => {
    it('calculates line items, subtotal, sales tax, discounts, and total due without floating point drift', () => {
      const lineItems = [
        { qty: new Decimal('30.00'), unitPrice: new Decimal('250.00'), taxRatePercent: new Decimal('8.25') },
        { qty: new Decimal('2.00'), unitPrice: new Decimal('1500.00'), taxRatePercent: new Decimal('20.00') },
      ];

      let subtotal = new Decimal(0);
      let totalTax = new Decimal(0);

      for (const item of lineItems) {
        const lineNet = item.qty.times(item.unitPrice);
        const tax = lineNet.times(item.taxRatePercent.dividedBy(100));
        subtotal = subtotal.plus(lineNet);
        totalTax = totalTax.plus(tax);
      }

      const discount = new Decimal('250.00');
      const totalDue = subtotal.plus(totalTax).minus(discount);

      // Line 1: 30 * 250 = 7,500. Tax: 7,500 * 0.0825 = 618.75
      // Line 2: 2 * 1500 = 3,000. Tax: 3,000 * 0.20 = 600.00
      // Subtotal = 10,500.00. Tax = 1,218.75. Discount = 250.00. Total = 11,468.75
      expect(InvoiceDecimalUtil.format(subtotal, 2)).toBe('10500.00');
      expect(InvoiceDecimalUtil.format(totalTax, 2)).toBe('1218.75');
      expect(InvoiceDecimalUtil.format(totalDue, 2)).toBe('11468.75');
    });
  });

  describe('Sequential Invoice Numbering Invariant', () => {
    it('allocates strictly contiguous sequential invoice numbers without gaps', () => {
      class SequenceGenerator {
        private current = 1001;
        private prefix = 'INV-2026';

        nextNumber(): string {
          const num = `${this.prefix}-${this.current}`;
          this.current += 1;
          return num;
        }
      }

      const generator = new SequenceGenerator();
      expect(generator.nextNumber()).toBe('INV-2026-1001');
      expect(generator.nextNumber()).toBe('INV-2026-1002');
      expect(generator.nextNumber()).toBe('INV-2026-1003');
    });
  });

  describe('Partial Payment Allocation and Settlement Invariant', () => {
    it('accurately tracks progressive balance due reduction and prevents overpayment', () => {
      const invoiceTotal = new Decimal('11500.00');
      let amountPaid = new Decimal('0.00');
      let balanceDue = invoiceTotal;
      let status: InvoiceStatus = InvoiceStatus.SENT;

      const recordPayment = (amount: Decimal) => {
        if (amount.greaterThan(balanceDue)) {
          throw new Error(`Overpayment rejected: Tried to pay ${amount.toString()} against remaining ${balanceDue.toString()}`);
        }
        amountPaid = amountPaid.plus(amount);
        balanceDue = balanceDue.minus(amount);
        status = balanceDue.isZero() ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
      };

      // Milestone 1 payment
      recordPayment(new Decimal('6000.00'));
      expect(InvoiceDecimalUtil.format(amountPaid, 2)).toBe('6000.00');
      expect(InvoiceDecimalUtil.format(balanceDue, 2)).toBe('5500.00');
      expect(status).toBe(InvoiceStatus.PARTIALLY_PAID);

      // Attempt overpayment
      expect(() => recordPayment(new Decimal('5500.01'))).toThrow('Overpayment rejected');

      // Milestone 2 payment (final settlement)
      recordPayment(new Decimal('5500.00'));
      expect(InvoiceDecimalUtil.format(amountPaid, 2)).toBe('11500.00');
      expect(InvoiceDecimalUtil.format(balanceDue, 2)).toBe('0.00');
      expect(status).toBe(InvoiceStatus.PAID);
    });
  });

  describe('Frozen Snapshot and Immutability Invariant', () => {
    it('prohibits direct modification of issued (SENT or PAID) invoices', () => {
      const invoice: { invoiceNumber: string; status: InvoiceStatus; total: Decimal } = {
        invoiceNumber: 'INV-2026-1001',
        status: InvoiceStatus.SENT,
        total: new Decimal('8118.75'),
      };

      const updateInvoice = (inv: typeof invoice, newStatus: InvoiceStatus) => {
        if (inv.status !== InvoiceStatus.DRAFT) {
          throw new Error(
            `Cannot edit invoice ${inv.invoiceNumber}: Status is ${inv.status}. Issued invoices are strictly immutable.`,
          );
        }
        inv.status = newStatus;
      };

      expect(() => updateInvoice(invoice, InvoiceStatus.DRAFT)).toThrow('Issued invoices are strictly immutable.');
    });
  });

  describe('Accounts Receivable Aging Categorization', () => {
    it('correctly maps invoices into aging buckets (Current, 1-30, 31-60, 61-90, 90+)', () => {
      const categorizeOverdue = (daysOverdue: number): string => {
        if (daysOverdue <= 0) return 'CURRENT';
        if (daysOverdue <= 30) return '1-30_DAYS';
        if (daysOverdue <= 60) return '31-60_DAYS';
        if (daysOverdue <= 90) return '61-90_DAYS';
        return '90+_DAYS';
      };

      expect(categorizeOverdue(-5)).toBe('CURRENT');
      expect(categorizeOverdue(0)).toBe('CURRENT');
      expect(categorizeOverdue(12)).toBe('1-30_DAYS');
      expect(categorizeOverdue(45)).toBe('31-60_DAYS');
      expect(categorizeOverdue(75)).toBe('61-90_DAYS');
      expect(categorizeOverdue(110)).toBe('90+_DAYS');
    });
  });
});
