import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceDecimalUtil } from '../../common/decimal.util';
import { InvoiceStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface AgingBucketSummary {
  currentAmount: string;
  overdue1To30: string;
  overdue31To60: string;
  overdue61To90: string;
  overdue90Plus: string;
  totalReceivables: string;
  invoicesCount: number;
}

@Injectable()
export class AgingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAgingReport(organizationId: string): Promise<AgingBucketSummary> {
    const activeInvoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        balanceDue: { gt: 0 },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    const now = new Date();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;

    let current = new Decimal(0);
    let overdue1_30 = new Decimal(0);
    let overdue31_60 = new Decimal(0);
    let overdue61_90 = new Decimal(0);
    let overdue90Plus = new Decimal(0);
    let total = new Decimal(0);

    for (const inv of activeInvoices) {
      const balance = new Decimal(inv.balanceDue.toString());
      total = total.plus(balance);

      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / MS_PER_DAY);

      if (daysOverdue <= 0) {
        current = current.plus(balance);
      } else if (daysOverdue >= 1 && daysOverdue <= 30) {
        overdue1_30 = overdue1_30.plus(balance);
      } else if (daysOverdue >= 31 && daysOverdue <= 60) {
        overdue31_60 = overdue31_60.plus(balance);
      } else if (daysOverdue >= 61 && daysOverdue <= 90) {
        overdue61_90 = overdue61_90.plus(balance);
      } else {
        overdue90Plus = overdue90Plus.plus(balance);
      }
    }

    return {
      currentAmount: InvoiceDecimalUtil.format(current),
      overdue1To30: InvoiceDecimalUtil.format(overdue1_30),
      overdue31To60: InvoiceDecimalUtil.format(overdue31_60),
      overdue61To90: InvoiceDecimalUtil.format(overdue61_90),
      overdue90Plus: InvoiceDecimalUtil.format(overdue90Plus),
      totalReceivables: InvoiceDecimalUtil.format(total),
      invoicesCount: activeInvoices.length,
    };
  }
}
