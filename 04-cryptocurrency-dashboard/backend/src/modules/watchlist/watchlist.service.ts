import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MarketService } from '../market/market.service';

@Injectable()
export class WatchlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly marketService: MarketService,
  ) {}

  async getUserWatchlist(userId: string) {
    const items = await this.prisma.watchlistItem.findMany({
      where: { userId },
      include: { asset: true },
    });

    const tickers = await this.marketService.getAllTickers();
    const tickerMap = new Map(tickers.map((t) => [t.symbol, t]));

    return items.map((i) => {
      const quote = tickerMap.get(i.asset.symbol);
      return {
        id: i.id,
        symbol: i.asset.symbol,
        name: i.asset.name,
        priceUsd: quote ? quote.priceUsd : '0.00',
        change24h: quote ? quote.change24h : '0.00',
        isStale: quote ? quote.isStale : false,
      };
    });
  }

  async addToWatchlist(userId: string, symbol: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    if (!asset) throw new NotFoundException(`Asset ${symbol} not found`);

    return this.prisma.watchlistItem.upsert({
      where: {
        userId_assetId: { userId, assetId: asset.id },
      },
      create: { userId, assetId: asset.id },
      update: {},
    });
  }

  async removeFromWatchlist(userId: string, symbol: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    if (!asset) throw new NotFoundException(`Asset ${symbol} not found`);

    return this.prisma.watchlistItem.deleteMany({
      where: { userId, assetId: asset.id },
    });
  }
}
