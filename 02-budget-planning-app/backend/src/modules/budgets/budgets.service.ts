import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.budget.findMany({
      where: { userId },
      include: {
        _count: { select: { periods: true, groups: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, data: { name: string; currency?: string; startingBalance?: string }) {
    const startingBal = DecimalUtil.toDecimal(data.startingBalance || '0.00');
    return this.prisma.budget.create({
      data: {
        userId,
        name: data.name,
        currency: data.currency || 'USD',
        startingBalance: startingBal,
      },
    });
  }

  async findById(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        groups: {
          include: { categories: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!budget) throw new NotFoundException(`Budget ${id} not found`);
    return budget;
  }

  async getPeriodWorkspace(userId: string, budgetId: string, year: number, month: number) {
    await this.findById(userId, budgetId);

    // Find or create period
    let period = await this.prisma.budgetPeriod.findUnique({
      where: { budgetId_year_month: { budgetId, year, month } },
      include: {
        allocations: {
          include: { category: true },
        },
      },
    });

    const budget = await this.prisma.budget.findUniqueOrThrow({ where: { id: budgetId } });

    if (!period) {
      // Find previous month's period to carry forward balances
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevPeriod = await this.prisma.budgetPeriod.findUnique({
        where: { budgetId_year_month: { budgetId, year: prevYear, month: prevMonth } },
        include: { allocations: true },
      });

      let carriedOverReadyToAssign = DecimalUtil.toDecimal(0);
      if (prevPeriod) {
        carriedOverReadyToAssign = DecimalUtil.toDecimal(prevPeriod.readyToAssign);
      } else {
        carriedOverReadyToAssign = DecimalUtil.toDecimal(budget.startingBalance);
      }

      period = await this.prisma.budgetPeriod.create({
        data: {
          budgetId,
          year,
          month,
          readyToAssign: carriedOverReadyToAssign,
          totalIncome: DecimalUtil.toDecimal(0),
          totalAssigned: DecimalUtil.toDecimal(0),
          totalActivity: DecimalUtil.toDecimal(0),
        },
        include: { allocations: { include: { category: true } } },
      });
    }

    // Get all groups and categories
    const groups = await this.prisma.categoryGroup.findMany({
      where: { budgetId },
      include: {
        categories: {
          include: {
            allocations: {
              where: { periodId: period.id },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const enrichedGroups = groups.map((g) => {
      let groupAssigned = DecimalUtil.toDecimal(0);
      let groupActivity = DecimalUtil.toDecimal(0);
      let groupAvailable = DecimalUtil.toDecimal(0);

      const enrichedCategories = g.categories.map((c) => {
        const alloc = c.allocations[0];
        const assigned = DecimalUtil.toDecimal(alloc?.assignedAmount || 0);
        const activity = DecimalUtil.toDecimal(alloc?.activityAmount || 0);
        const available = DecimalUtil.toDecimal(alloc?.availableAmount || 0);

        groupAssigned = DecimalUtil.add(groupAssigned, assigned);
        groupActivity = DecimalUtil.add(groupActivity, activity);
        groupAvailable = DecimalUtil.add(groupAvailable, available);

        return {
          id: c.id,
          name: c.name,
          colorHex: c.colorHex,
          targetAmount: c.targetAmount ? DecimalUtil.format(c.targetAmount) : null,
          assigned: DecimalUtil.format(assigned),
          activity: DecimalUtil.format(activity),
          available: DecimalUtil.format(available),
          isOverspent: DecimalUtil.toDecimal(available).isNegative(),
        };
      });

      return {
        id: g.id,
        name: g.name,
        totalAssigned: DecimalUtil.format(groupAssigned),
        totalActivity: DecimalUtil.format(groupActivity),
        totalAvailable: DecimalUtil.format(groupAvailable),
        categories: enrichedCategories,
      };
    });

    return {
      periodId: period.id,
      year: period.year,
      month: period.month,
      readyToAssign: DecimalUtil.format(period.readyToAssign),
      totalIncome: DecimalUtil.format(period.totalIncome),
      totalAssigned: DecimalUtil.format(period.totalAssigned),
      totalActivity: DecimalUtil.format(period.totalActivity),
      groups: enrichedGroups,
    };
  }
}
