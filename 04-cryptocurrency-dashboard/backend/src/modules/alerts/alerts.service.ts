import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { CryptoDecimalUtil } from '../../common/decimal.util';
import { AlertCondition, AlertStatus } from '@prisma/client';
import Decimal from 'decimal.js';

export interface CreateAlertDto {
  symbol: string;
  condition: AlertCondition;
  targetValue: string;
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async listUserAlerts(userId: string) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: { userId },
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    });

    const tickers = await this.marketService.getAllTickers();
    const tickerMap = new Map(tickers.map((t) => [t.symbol, new Decimal(t.priceUsd)]));

    return alerts.map((a) => {
      const currentPrice = tickerMap.get(a.asset.symbol) || new Decimal(0);
      const target = new Decimal(a.targetValue.toString());

      return {
        id: a.id,
        symbol: a.asset.symbol,
        name: a.asset.name,
        condition: a.condition,
        targetValue: CryptoDecimalUtil.formatCrypto(target, 4),
        currentPriceUsd: CryptoDecimalUtil.formatCrypto(currentPrice, 4),
        status: a.status,
        triggeredAt: a.triggeredAt,
        createdAt: a.createdAt,
      };
    });
  }

  async createAlert(userId: string, dto: CreateAlertDto) {
    const asset = await this.prisma.asset.findUnique({
      where: { symbol: dto.symbol.toUpperCase() },
    });
    if (!asset) throw new NotFoundException(`Asset ${dto.symbol} not found`);

    return this.prisma.priceAlert.create({
      data: {
        userId,
        assetId: asset.id,
        condition: dto.condition,
        targetValue: CryptoDecimalUtil.toPrisma(dto.targetValue),
        status: AlertStatus.ACTIVE,
      },
      include: { asset: true },
    });
  }

  async deleteAlert(userId: string, alertId: string) {
    const alert = await this.prisma.priceAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.priceAlert.delete({ where: { id: alertId } });
  }

  async evaluateAlerts() {
    const activeAlerts = await this.prisma.priceAlert.findMany({
      where: { status: AlertStatus.ACTIVE },
      include: { asset: true },
    });

    const tickers = await this.marketService.getAllTickers();
    const tickerMap = new Map(tickers.map((t) => [t.symbol, new Decimal(t.priceUsd)]));

    const triggered = [];
    for (const alert of activeAlerts) {
      const currentPrice = tickerMap.get(alert.asset.symbol);
      if (!currentPrice) continue;

      const target = new Decimal(alert.targetValue.toString());
      let isTriggered = false;

      if (alert.condition === AlertCondition.PRICE_ABOVE && currentPrice.greaterThanOrEqualTo(target)) {
        isTriggered = true;
      } else if (alert.condition === AlertCondition.PRICE_BELOW && currentPrice.lessThanOrEqualTo(target)) {
        isTriggered = true;
      }

      if (isTriggered) {
        await this.prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.TRIGGERED,
            triggeredAt: new Date(),
          },
        });
        triggered.push(alert.id);
      }
    }

    return { evaluatedCount: activeAlerts.length, triggeredCount: triggered.length };
  }
}
