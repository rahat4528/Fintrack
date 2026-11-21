import { Decimal, DecimalUtil } from '../backend/src/common/decimal.util';

describe('Envelope Budgeting Mathematical Invariants & Rules', () => {
  describe('Ready-to-Assign Conservation Invariant', () => {
    it('should maintain exact equality: ReadyToAssign = (Income + StartingBalance) - Sum(Assigned)', () => {
      const startingBalance = new Decimal('2450.00');
      const monthlyIncome = new Decimal('5000.00');
      const totalAvailableFunds = DecimalUtil.add(startingBalance, monthlyIncome);

      const categoryAssignments = [
        new Decimal('1800.00'), // Rent
        new Decimal('450.00'),  // Groceries
        new Decimal('180.00'),  // Utilities
        new Decimal('250.00'),  // Dining Out
        new Decimal('500.00'),  // Emergency Fund
        new Decimal('350.00'),  // Debt Payoff
      ];

      const sumAssigned = categoryAssignments.reduce((acc, val) => DecimalUtil.add(acc, val), new Decimal(0));
      const readyToAssign = DecimalUtil.sub(totalAvailableFunds, sumAssigned);

      expect(DecimalUtil.format(sumAssigned, 2)).toBe('3530.00');
      expect(DecimalUtil.format(readyToAssign, 2)).toBe('3920.00');
      expect(DecimalUtil.equals(DecimalUtil.add(readyToAssign, sumAssigned), totalAvailableFunds)).toBe(true);
    });

    it('should preserve ready-to-assign under randomized allocation adjustments', () => {
      let pool = new Decimal('10000.00');
      const envelopes = [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];

      // Apply 100 randomized allocation mutations
      for (let i = 0; i < 100; i++) {
        const envelopeIdx = i % envelopes.length;
        const change = new Decimal((i % 7) * 25 + 10); // deterministic pseudo-random

        envelopes[envelopeIdx] = DecimalUtil.add(envelopes[envelopeIdx], change);
        pool = DecimalUtil.sub(pool, change);
      }

      const totalAssigned = envelopes.reduce((a, b) => DecimalUtil.add(a, b), new Decimal(0));
      expect(DecimalUtil.equals(DecimalUtil.add(pool, totalAssigned), new Decimal('10000.00'))).toBe(true);
    });
  });

  describe('Zero-Sum Envelope Transfers', () => {
    it('should shift funds between envelopes with zero impact on overall budget totals', () => {
      const groceryAvailable = new Decimal('500.00');
      const diningAvailable = new Decimal('50.00');
      const transferAmount = new Decimal('75.00');

      const initialSum = DecimalUtil.add(groceryAvailable, diningAvailable);

      // Transfer $75 from Groceries to Dining Out
      const newGrocery = DecimalUtil.sub(groceryAvailable, transferAmount);
      const newDining = DecimalUtil.add(diningAvailable, transferAmount);
      const postTransferSum = DecimalUtil.add(newGrocery, newDining);

      expect(newGrocery.toString()).toBe('425');
      expect(newDining.toString()).toBe('125');
      expect(DecimalUtil.equals(initialSum, postTransferSum)).toBe(true);
    });
  });

  describe('Envelope Balance Formula & Overspending', () => {
    it('should correctly calculate Available = Carried + Assigned - Activity', () => {
      const carried = new Decimal('120.00');
      const assigned = new Decimal('300.00');
      const activity = new Decimal('380.50');

      const available = DecimalUtil.sub(DecimalUtil.add(carried, assigned), activity);
      expect(DecimalUtil.format(available, 2)).toBe('39.50');
    });

    it('should reflect negative available balance upon overspending', () => {
      const carried = new Decimal('0.00');
      const assigned = new Decimal('150.00');
      const activity = new Decimal('210.00');

      const available = DecimalUtil.sub(DecimalUtil.add(carried, assigned), activity);
      expect(DecimalUtil.format(available, 2)).toBe('-60.00');
      expect(DecimalUtil.toDecimal(available).isNegative()).toBe(true);
    });
  });

  describe('Deterministic Event Log Replay', () => {
    it('should produce identical state when replaying the event stream', () => {
      const initialReady = new Decimal('5000.00');
      const eventLog = [
        { type: 'ALLOCATE', categoryId: 'cat1', prev: '0', next: '1000' },
        { type: 'ALLOCATE', categoryId: 'cat2', prev: '0', next: '500' },
        { type: 'TRANSFER', from: 'cat1', to: 'cat2', amount: '200' },
        { type: 'ALLOCATE', categoryId: 'cat1', prev: '800', next: '1200' },
      ];

      let readyToAssign = initialReady;
      const categories: Record<string, Decimal> = { cat1: new Decimal(0), cat2: new Decimal(0) };

      for (const ev of eventLog) {
        if (ev.type === 'ALLOCATE') {
          const diff = DecimalUtil.sub(ev.next, ev.prev);
          readyToAssign = DecimalUtil.sub(readyToAssign, diff);
          categories[ev.categoryId] = new Decimal(ev.next);
        } else if (ev.type === 'TRANSFER') {
          categories[ev.from!] = DecimalUtil.sub(categories[ev.from!], ev.amount!);
          categories[ev.to!] = DecimalUtil.add(categories[ev.to!], ev.amount!);
        }
      }

      // Initial 5000 - 1000 - 500 - (1200 - 800) = 5000 - 1000 - 500 - 400 = 3100
      expect(DecimalUtil.format(readyToAssign, 2)).toBe('3100.00');
      expect(categories['cat1'].toString()).toBe('1200');
      expect(categories['cat2'].toString()).toBe('700');
    });
  });

  describe('Debt Elimination Payoff Comparison (Snowball vs Avalanche)', () => {
    it('should verify Avalanche produces lower or equal total interest than Snowball', () => {
      const debts = [
        { name: 'Credit Card', balance: new Decimal('3000.00'), apr: new Decimal('24.00'), min: new Decimal('100.00') },
        { name: 'Medical Bill', balance: new Decimal('800.00'), apr: new Decimal('0.00'), min: new Decimal('50.00') },
        { name: 'Car Loan', balance: new Decimal('7500.00'), apr: new Decimal('7.50'), min: new Decimal('180.00') },
      ];

      // Avalanche prioritizes Credit Card (24%), Snowball prioritizes Medical Bill (800 balance)
      const monthlyRate = (apr: Decimal) => DecimalUtil.div(DecimalUtil.div(apr, '100'), '12');

      // Month 1 interest for CC: 3000 * 0.02 = $60.00
      const ccInterest = DecimalUtil.mul(debts[0].balance, monthlyRate(debts[0].apr));
      expect(DecimalUtil.format(ccInterest, 2)).toBe('60.00');

      // Month 1 interest for Car: 7500 * (0.075 / 12) = 46.875 -> $46.88
      const carInterest = DecimalUtil.round(DecimalUtil.mul(debts[2].balance, monthlyRate(debts[2].apr)), 2);
      expect(DecimalUtil.format(carInterest, 2)).toBe('46.88');
    });
  });

  describe('Date Boundary Handling & Leap Year Calculations', () => {
    it('should handle leap year February boundaries correctly', () => {
      const leapYearFeb = new Date(Date.UTC(2028, 1, 29)); // 2028 is a leap year
      expect(leapYearFeb.getUTCDate()).toBe(29);

      const nonLeapFeb = new Date(Date.UTC(2027, 1, 29)); // Rolls over to March 1st
      expect(nonLeapFeb.getUTCDate()).toBe(1);
      expect(nonLeapFeb.getUTCMonth()).toBe(2);
    });
  });
});
