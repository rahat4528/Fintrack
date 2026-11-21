import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import Decimal from 'decimal.js';

export interface DebtItem {
  id: string;
  name: string;
  balance: string;
  apr: string;
  minPayment: string;
}

@Injectable()
export class DebtPlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async getDebtsForBudget(userId: string, budgetId: string) {
    return this.prisma.debtPlan.findMany({
      where: { budgetId, budget: { userId } },
      orderBy: { currentBalance: 'asc' },
    });
  }

  simulatePayoff(debts: DebtItem[], extraMonthlyPaymentStr: string, strategy: 'SNOWBALL' | 'AVALANCHE') {
    const extraPayment = DecimalUtil.toDecimal(extraMonthlyPaymentStr || '0.00');

    // Clone debts to avoid mutating
    let workingDebts = debts.map((d) => ({
      id: d.id,
      name: d.name,
      balance: DecimalUtil.toDecimal(d.balance),
      apr: DecimalUtil.toDecimal(d.apr),
      minPayment: DecimalUtil.toDecimal(d.minPayment),
    }));

    if (strategy === 'SNOWBALL') {
      workingDebts.sort((a, b) => a.balance.comparedTo(b.balance));
    } else {
      // Avalanche: highest APR first
      workingDebts.sort((a, b) => b.apr.comparedTo(a.apr));
    }

    let months = 0;
    let totalInterest = DecimalUtil.toDecimal(0);
    const maxMonths = 360; // 30 years ceiling guard

    while (workingDebts.some((d) => DecimalUtil.toDecimal(d.balance).isPositive()) && months < maxMonths) {
      months++;
      let freedSnowballCash = DecimalUtil.toDecimal(0);

      // 1. Accrue monthly interest on each active debt
      for (const d of workingDebts) {
        if (DecimalUtil.toDecimal(d.balance).isPositive()) {
          const monthlyRate = DecimalUtil.div(DecimalUtil.div(d.apr, '100'), '12');
          const interest = DecimalUtil.round(DecimalUtil.mul(d.balance, monthlyRate), 2);
          d.balance = DecimalUtil.add(d.balance, interest);
          totalInterest = DecimalUtil.add(totalInterest, interest);

          // Apply minimum payment
          const pay = Decimal.min(d.balance, d.minPayment);
          d.balance = DecimalUtil.sub(d.balance, pay);

          if (DecimalUtil.toDecimal(d.balance).isZero()) {
            freedSnowballCash = DecimalUtil.add(freedSnowballCash, d.minPayment);
          }
        }
      }

      // 2. Direct extra payment + freed minimum payments to first active debt
      let availableExtra = DecimalUtil.add(extraPayment, freedSnowballCash);
      for (const d of workingDebts) {
        if (DecimalUtil.toDecimal(d.balance).isPositive() && DecimalUtil.toDecimal(availableExtra).isPositive()) {
          const extraPay = Decimal.min(d.balance, availableExtra);
          d.balance = DecimalUtil.sub(d.balance, extraPay);
          availableExtra = DecimalUtil.sub(availableExtra, extraPay);
        }
      }
    }

    return {
      strategy,
      monthsToPayoff: months,
      yearsToPayoff: (months / 12).toFixed(1),
      totalInterestPaid: DecimalUtil.format(totalInterest),
    };
  }

  compareStrategies(debts: DebtItem[], extraMonthlyPaymentStr: string) {
    const snowball = this.simulatePayoff(debts, extraMonthlyPaymentStr, 'SNOWBALL');
    const avalanche = this.simulatePayoff(debts, extraMonthlyPaymentStr, 'AVALANCHE');

    const interestDifference = DecimalUtil.sub(
      snowball.totalInterestPaid,
      avalanche.totalInterestPaid,
    );

    return {
      snowball,
      avalanche,
      avalancheSavingsOverSnowball: DecimalUtil.format(Decimal.max(0, interestDifference)),
    };
  }
}
