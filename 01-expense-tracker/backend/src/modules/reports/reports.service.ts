import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { DecimalUtil } from '../../common/decimal.util';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const [accounts, transactions] = await Promise.all([
      this.prisma.financialAccount.findMany({
        where: { userId, isArchived: false },
      }),
      this.prisma.transaction.findMany({
        where: { userId, deletedAt: null },
      }),
    ]);

    let totalNetWorth = DecimalUtil.toDecimal(0);
    for (const acc of accounts) {
      totalNetWorth = DecimalUtil.add(totalNetWorth, acc.currentBalance);
    }

    let totalIncome = DecimalUtil.toDecimal(0);
    let totalExpense = DecimalUtil.toDecimal(0);

    for (const tx of transactions) {
      if (tx.type === TransactionType.INCOME) {
        totalIncome = DecimalUtil.add(totalIncome, tx.amount);
      } else if (tx.type === TransactionType.EXPENSE) {
        totalExpense = DecimalUtil.add(totalExpense, tx.amount);
      }
    }

    const netSavings = DecimalUtil.sub(totalIncome, totalExpense);
    const savingsRate = DecimalUtil.isPositive(totalIncome)
      ? DecimalUtil.round(DecimalUtil.mul(DecimalUtil.div(netSavings, totalIncome), 100), 1).toNumber()
      : 0;

    return {
      totalNetWorth: DecimalUtil.format(totalNetWorth),
      totalIncome: DecimalUtil.format(totalIncome),
      totalExpense: DecimalUtil.format(totalExpense),
      netSavings: DecimalUtil.format(netSavings),
      savingsRatePercent: savingsRate,
      activeAccountsCount: accounts.length,
      transactionCount: transactions.length,
    };
  }

  async getCategoryBreakdown(userId: string, startDate?: string, endDate?: string) {
    const where: any = {
      userId,
      type: TransactionType.EXPENSE,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) where.transactionDate.lte = new Date(endDate);
    }

    const expenses = await this.prisma.transaction.findMany({
      where,
      include: { category: true },
    });

    let totalExpense = DecimalUtil.toDecimal(0);
    const categoryMap = new Map<string, { id: string; name: string; color: string; total: any }>();

    for (const tx of expenses) {
      totalExpense = DecimalUtil.add(totalExpense, tx.amount);
      const catId = tx.category?.id || 'uncategorized';
      const catName = tx.category?.name || 'Uncategorized';
      const catColor = tx.category?.colorHex || '#9ca3af';

      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { id: catId, name: catName, color: catColor, total: DecimalUtil.toDecimal(0) });
      }
      const entry = categoryMap.get(catId);
      entry.total = DecimalUtil.add(entry.total, tx.amount);
    }

    const categories = Array.from(categoryMap.values()).map((c) => {
      const percentage = DecimalUtil.isPositive(totalExpense)
        ? DecimalUtil.round(DecimalUtil.mul(DecimalUtil.div(c.total, totalExpense), 100), 2).toNumber()
        : 0;
      return {
        id: c.id,
        name: c.name,
        colorHex: c.color,
        amount: DecimalUtil.format(c.total),
        percentage,
      };
    });

    categories.sort((a, b) => b.percentage - a.percentage);

    return {
      totalExpense: DecimalUtil.format(totalExpense),
      categories,
    };
  }

  async getMonthlyTrends(userId: string, year: number = new Date().getFullYear()) {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const txs = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const monthlyData = months.map((m, idx) => ({
      month: m,
      monthIndex: idx,
      income: DecimalUtil.toDecimal(0),
      expense: DecimalUtil.toDecimal(0),
      net: DecimalUtil.toDecimal(0),
    }));

    for (const tx of txs) {
      const mIdx = new Date(tx.transactionDate).getMonth();
      if (tx.type === TransactionType.INCOME) {
        monthlyData[mIdx].income = DecimalUtil.add(monthlyData[mIdx].income, tx.amount);
      } else if (tx.type === TransactionType.EXPENSE) {
        monthlyData[mIdx].expense = DecimalUtil.add(monthlyData[mIdx].expense, tx.amount);
      }
    }

    return monthlyData.map((d) => {
      const net = DecimalUtil.sub(d.income, d.expense);
      return {
        month: d.month,
        income: DecimalUtil.round(d.income, 2).toNumber(),
        expense: DecimalUtil.round(d.expense, 2).toNumber(),
        net: DecimalUtil.round(net, 2).toNumber(),
      };
    });
  }
}
