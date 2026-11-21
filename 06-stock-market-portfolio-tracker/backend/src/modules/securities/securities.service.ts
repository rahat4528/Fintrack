import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockDecimalUtil } from '../../common/decimal.util';

@Injectable()
export class SecuritiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSecurities() {
    const securities = await this.prisma.security.findMany({
      orderBy: { symbol: 'asc' },
    });

    return securities.map((s) => ({
      ...s,
      currentPrice: StockDecimalUtil.formatPrice(s.currentPrice),
    }));
  }
}
