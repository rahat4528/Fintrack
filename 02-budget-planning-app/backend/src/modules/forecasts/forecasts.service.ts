import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecimalUtil } from '../../common/decimal.util';

@Injectable()
export class ForecastsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBillCalendar(userId: string, budgetId: string) {
    const bills = await this.prisma.recurringBill.findMany({
      where: { budgetId, budget: { userId }, isActive: true },
      orderBy: { dueDay: 'asc' },
    });

    let totalMonthlyCommitted = DecimalUtil.toDecimal(0);
    for (const b of bills) {
      totalMonthlyCommitted = DecimalUtil.add(totalMonthlyCommitted, b.amount);
    }

    return {
      totalMonthlyCommitted: DecimalUtil.format(totalMonthlyCommitted),
      bills: bills.map((b) => ({
        id: b.id,
        name: b.name,
        amount: DecimalUtil.format(b.amount),
        dueDay: b.dueDay,
        frequency: b.frequency,
      })),
    };
  }
}
