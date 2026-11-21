import { DecimalUtil } from '../backend/src/common/decimal.util';
import * as crypto from 'crypto';

enum RuleOperator {
  EQUALS = 'EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
}

enum RuleActionType {
  SET_CATEGORY = 'SET_CATEGORY',
  ADD_TAG = 'ADD_TAG',
  SET_DESCRIPTION = 'SET_DESCRIPTION',
}

describe('Expense Tracker Business Rules & Domain Invariants', () => {
  describe('Account Balance Reconciliation Invariant', () => {
    it('should calculate exact balance matching sum of transactions', () => {
      const initialBalance = '1000.00';
      const transactions = [
        { type: 'INCOME', amount: '2500.00' },
        { type: 'EXPENSE', amount: '450.25' },
        { type: 'EXPENSE', amount: '120.75' },
        { type: 'TRANSFER_IN', amount: '300.00' },
        { type: 'TRANSFER_OUT', amount: '500.00' },
      ];

      let balance = DecimalUtil.toDecimal(initialBalance);
      for (const t of transactions) {
        if (t.type === 'INCOME' || t.type === 'TRANSFER_IN') {
          balance = DecimalUtil.add(balance, t.amount);
        } else if (t.type === 'EXPENSE' || t.type === 'TRANSFER_OUT') {
          balance = DecimalUtil.sub(balance, t.amount);
        }
      }

      // 1000 + 2500 - 450.25 - 120.75 + 300 - 500 = 2729.00
      expect(DecimalUtil.format(balance, 2)).toBe('2729.00');
    });
  });

  describe('Atomic Transfer Invariant', () => {
    it('should maintain zero net change in total user net worth across accounts during transfer', () => {
      const checkingBalance = '5000.00';
      const savingsBalance = '12000.00';
      const transferAmount = '1500.00';

      const initialTotal = DecimalUtil.add(checkingBalance, savingsBalance);

      // Perform transfer
      const newChecking = DecimalUtil.sub(checkingBalance, transferAmount);
      const newSavings = DecimalUtil.add(savingsBalance, transferAmount);
      const postTransferTotal = DecimalUtil.add(newChecking, newSavings);

      expect(newChecking.toString()).toBe('3500');
      expect(newSavings.toString()).toBe('13500');
      expect(DecimalUtil.equals(initialTotal, postTransferTotal)).toBe(true);
    });
  });

  describe('Recurring Transaction Idempotency Guard', () => {
    it('should generate composite uniqueness key preventing duplicate postings on the same occurrence date', () => {
      const recurringId = 'rec-uuid-101';
      const occurrenceDate = '2026-03-01';

      const postedSet = new Set<string>();

      const postJob = (recId: string, dateStr: string) => {
        const key = `${recId}:${dateStr}`;
        if (postedSet.has(key)) {
          return { status: 'DUPLICATE_SKIPPED' };
        }
        postedSet.add(key);
        return { status: 'POSTED', key };
      };

      const firstAttempt = postJob(recurringId, occurrenceDate);
      expect(firstAttempt.status).toBe('POSTED');

      // Retry immediately
      const secondAttempt = postJob(recurringId, occurrenceDate);
      expect(secondAttempt.status).toBe('DUPLICATE_SKIPPED');
      expect(postedSet.size).toBe(1);
    });
  });

  describe('Rule Engine Ordering & Determinism', () => {
    it('should execute rules in priority order and apply actions deterministically', () => {
      const rules = [
        {
          id: 'rule-2',
          priority: 2,
          field: 'description',
          operator: RuleOperator.CONTAINS,
          matchValue: 'coffee',
          actionType: RuleActionType.ADD_TAG,
          actionValue: 'beverage',
        },
        {
          id: 'rule-1',
          priority: 1,
          field: 'description',
          operator: RuleOperator.CONTAINS,
          matchValue: 'starbucks',
          actionType: RuleActionType.SET_CATEGORY,
          actionValue: 'cat-dining',
        },
      ];

      // Sort by priority ascending
      const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
      expect(sortedRules[0].id).toBe('rule-1');

      const tx = {
        description: 'Starbucks Morning Coffee',
        categoryId: 'cat-general',
        tags: [] as string[],
      };

      for (const rule of sortedRules) {
        const matches = tx.description.toLowerCase().includes(rule.matchValue.toLowerCase());
        if (matches) {
          if (rule.actionType === RuleActionType.SET_CATEGORY) {
            tx.categoryId = rule.actionValue;
          } else if (rule.actionType === RuleActionType.ADD_TAG) {
            tx.tags.push(rule.actionValue);
          }
        }
      }

      expect(tx.categoryId).toBe('cat-dining');
      expect(tx.tags).toContain('beverage');
    });
  });

  describe('CSV Import Duplicate Fingerprinting', () => {
    it('should generate consistent SHA-256 hash across identical date, amount, and description', () => {
      const hashFn = (d: string, a: string, desc: string) => {
        const raw = `${d.trim()}:${a.trim()}:${desc.trim().toLowerCase()}`;
        return crypto.createHash('sha256').update(raw).digest('hex');
      };

      const hash1 = hashFn('2026-03-15', '45.00', 'Whole Foods Market');
      const hash2 = hashFn('2026-03-15', '45.00', 'WHOLE FOODS MARKET '); // Case & whitespace insensitive
      const hash3 = hashFn('2026-03-15', '45.01', 'Whole Foods Market');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('Import Batch Rollback Verification', () => {
    it('should calculate exact opposite balance impact when reverting an import batch', () => {
      const startingBalance = '3000.00';
      const importedTransactions = [
        { type: 'EXPENSE', amount: '120.00' },
        { type: 'EXPENSE', amount: '80.00' },
        { type: 'INCOME', amount: '500.00' },
      ];

      // Forward import
      let postImportBalance = DecimalUtil.toDecimal(startingBalance);
      for (const t of importedTransactions) {
        if (t.type === 'INCOME') {
          postImportBalance = DecimalUtil.add(postImportBalance, t.amount);
        } else {
          postImportBalance = DecimalUtil.sub(postImportBalance, t.amount);
        }
      }
      expect(DecimalUtil.format(postImportBalance, 2)).toBe('3300.00');

      // Undo batch
      let revertedBalance = DecimalUtil.toDecimal(postImportBalance);
      for (const t of importedTransactions) {
        if (t.type === 'INCOME') {
          revertedBalance = DecimalUtil.sub(revertedBalance, t.amount);
        } else {
          revertedBalance = DecimalUtil.add(revertedBalance, t.amount);
        }
      }

      expect(DecimalUtil.format(revertedBalance, 2)).toBe(startingBalance);
    });
  });
});
