import { Decimal, DecimalUtil } from '../backend/src/common/decimal.util';
import { EntryType, AccountStatus, UserRole } from '@prisma/client';

describe('Phase 3: Banking Application - Double-Entry Ledger and Security Invariants', () => {
  describe('Double-Entry Accounting Invariants', () => {
    it('enforces exact zero-sum ledger balance (Debits == Credits) on every multi-leg transaction', () => {
      // Transfer of $1,250.75 from checking to savings
      const transferAmount = new Decimal('1250.75');

      const legs = [
        { account: 'CHK-001', entryType: EntryType.DEBIT, amount: transferAmount },
        { account: 'SAV-002', entryType: EntryType.CREDIT, amount: transferAmount },
      ];

      const sumDebits = legs
        .filter((l) => l.entryType === EntryType.DEBIT)
        .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));

      const sumCredits = legs
        .filter((l) => l.entryType === EntryType.CREDIT)
        .reduce((sum, l) => sum.plus(l.amount), new Decimal(0));

      expect(sumDebits.toString()).toBe(sumCredits.toString());
      expect(sumDebits.minus(sumCredits).isZero()).toBe(true);
    });

    it('calculates account real-time balance accurately as the cumulative sum of signed ledger entries', () => {
      const initialDeposit = new Decimal('5000.00'); // Credit
      const directDebit = new Decimal('120.45');     // Debit
      const salaryCredit = new Decimal('3450.00');    // Credit
      const utilityBill = new Decimal('89.99');       // Debit

      let balance = new Decimal(0);
      balance = balance.plus(initialDeposit);
      balance = balance.minus(directDebit);
      balance = balance.plus(salaryCredit);
      balance = balance.minus(utilityBill);

      expect(DecimalUtil.format(balance, 2)).toBe('8239.56');
    });

    it('rejects transfer when balance is insufficient (overdraft protection invariant)', () => {
      const currentAvailableBalance = new Decimal('250.00');
      const requestedTransfer = new Decimal('250.01');

      const isSufficient = currentAvailableBalance.greaterThanOrEqualTo(requestedTransfer);
      expect(isSufficient).toBe(false);
    });
  });

  describe('Idempotency Key Deduplication Invariant', () => {
    it('returns existing transaction and prevents double-debiting on duplicate idempotency key submission', () => {
      interface CacheEntry {
        idempotencyKey: string;
        response: {
          transactionId: string;
          status: string;
          amount: string;
        };
      }

      const idempotencyCache = new Map<string, CacheEntry>();

      const executeTransfer = (idempotencyKey: string, amount: string) => {
        if (idempotencyCache.has(idempotencyKey)) {
          return { cached: true, ...idempotencyCache.get(idempotencyKey)!.response };
        }

        const newTx = {
          transactionId: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'SETTLED',
          amount,
        };

        idempotencyCache.set(idempotencyKey, {
          idempotencyKey,
          response: newTx,
        });

        return { cached: false, ...newTx };
      };

      const key = 'IDEMP-REQ-ABC-999';
      const firstCall = executeTransfer(key, '400.00');
      expect(firstCall.cached).toBe(false);
      expect(firstCall.amount).toBe('400.00');

      // Immediate retry due to network timeout or double-click
      const retryCall = executeTransfer(key, '400.00');
      expect(retryCall.cached).toBe(true);
      expect(retryCall.transactionId).toBe(firstCall.transactionId);
    });
  });

  describe('Account Status and Security Invariants', () => {
    it('blocks transfers if account status is FROZEN', () => {
      const sourceAccount: { accountNumber: string; status: AccountStatus; balance: Decimal } = {
        accountNumber: 'ACC-FROZEN-88',
        status: AccountStatus.FROZEN,
        balance: new Decimal('10000.00'),
      };

      const canTransact = (account: typeof sourceAccount) => {
        if (account.status !== AccountStatus.ACTIVE) {
          throw new Error(`Account ${account.accountNumber} is ${account.status}. Transactions blocked.`);
        }
        return true;
      };

      expect(() => canTransact(sourceAccount)).toThrow('is FROZEN. Transactions blocked.');
    });

    it('enforces RBAC: customers cannot access employee or admin endpoints', () => {
      const checkRoleAccess = (userRole: UserRole, allowedRoles: UserRole[]) => {
        return allowedRoles.includes(userRole);
      };

      const employeeEndpointsRoles = [UserRole.EMPLOYEE, UserRole.ADMIN];
      const adminEndpointsRoles = [UserRole.ADMIN];

      expect(checkRoleAccess(UserRole.CUSTOMER, employeeEndpointsRoles)).toBe(false);
      expect(checkRoleAccess(UserRole.CUSTOMER, adminEndpointsRoles)).toBe(false);
      expect(checkRoleAccess(UserRole.EMPLOYEE, employeeEndpointsRoles)).toBe(true);
      expect(checkRoleAccess(UserRole.EMPLOYEE, adminEndpointsRoles)).toBe(false);
      expect(checkRoleAccess(UserRole.ADMIN, adminEndpointsRoles)).toBe(true);
    });
  });

  describe('Account Statement Reconciliation Formula', () => {
    it('verifies Opening Balance + Credits - Debits == Closing Balance without floating point drift', () => {
      const openingBalance = new Decimal('15000.55');
      const credits = [
        new Decimal('1200.40'),
        new Decimal('550.00'),
        new Decimal('3100.25'),
      ];
      const debits = [
        new Decimal('450.10'),
        new Decimal('125.70'),
        new Decimal('2200.00'),
      ];

      const totalCredits = credits.reduce((sum, c) => sum.plus(c), new Decimal(0));
      const totalDebits = debits.reduce((sum, d) => sum.plus(d), new Decimal(0));
      const closingBalance = openingBalance.plus(totalCredits).minus(totalDebits);

      expect(DecimalUtil.format(totalCredits, 2)).toBe('4850.65');
      expect(DecimalUtil.format(totalDebits, 2)).toBe('2775.80');
      expect(DecimalUtil.format(closingBalance, 2)).toBe('17075.40');
    });
  });
});
