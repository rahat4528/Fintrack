import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';
import { AlertThresholdType, TransactionType } from '@prisma/client';

@Injectable()
export class AlertsGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllGoals(userId: string) {
    return this.prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(
    userId: string,
    data: { name: string; targetAmount: string; targetDate?: string },
  ) {
    return this.prisma.savingsGoal.create({
      data: {
        userId,
        name: data.name,
        targetAmount: DecimalUtil.toDecimal(data.targetAmount),
        currentAmount: DecimalUtil.toDecimal(0),
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });
  }

  async updateGoalContribution(userId: string, id: string, addAmount: string) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
    });
    if (!goal) {
      throw new NotFoundException(`Savings goal ${id} not found`);
    }

    const current = DecimalUtil.toDecimal(goal.currentAmount);
    const updated = DecimalUtil.add(current, addAmount);
    const isCompleted = DecimalUtil.toDecimal(updated).greaterThanOrEqualTo(goal.targetAmount);

    return this.prisma.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: updated,
        isCompleted,
      },
    });
  }

  async findAllAlerts(userId: string) {
    return this.prisma.budgetAlert.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { periodYear: 'desc' },
    });
  }

  async createAlert(
    userId: string,
    data: {
      categoryId: string;
      thresholdValue: string;
      periodMonth: number;
      periodYear: number;
    },
  ) {
    return this.prisma.budgetAlert.upsert({
      where: {
        userId_categoryId_periodYear_periodMonth: {
          userId,
          categoryId: data.categoryId,
          periodYear: data.periodYear,
          periodMonth: data.periodMonth,
        },
      },
      update: {
        thresholdValue: DecimalUtil.toDecimal(data.thresholdValue),
        hasFired: false,
      },
      create: {
        userId,
        categoryId: data.categoryId,
        thresholdValue: DecimalUtil.toDecimal(data.thresholdValue),
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
      },
    });
  }

  async checkAlerts(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const alerts = await this.prisma.budgetAlert.findMany({
      where: {
        userId,
        periodMonth: currentMonth,
        periodYear: currentYear,
      },
      include: { category: true },
    });

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const notifications: Array<{ category: string; spent: string; threshold: string; alertId: string }> = [];

    for (const alert of alerts) {
      const expenses = await this.prisma.transaction.findMany({
        where: {
          userId,
          categoryId: alert.categoryId,
          type: TransactionType.EXPENSE,
          deletedAt: null,
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      let spent = DecimalUtil.toDecimal(0);
      for (const t of expenses) {
        spent = DecimalUtil.add(spent, t.amount);
      }

      if (DecimalUtil.toDecimal(spent).greaterThan(alert.thresholdValue)) {
        if (!alert.hasFired) {
          await this.prisma.budgetAlert.update({
            where: { id: alert.id },
            data: { hasFired: true },
          });
        }
        notifications.push({
          category: alert.category.name,
          spent: DecimalUtil.format(spent),
          threshold: DecimalUtil.format(alert.thresholdValue),
          alertId: alert.id,
        });
      }
    }

    return {
      evaluatedCount: alerts.length,
      triggeredAlerts: notifications,
    };
  }
}
