import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoDecimalUtil } from '../../common/decimal.util';
import Decimal from 'decimal.js';

export interface MarketTickerDto {
  symbol: string;
  name: string;
  priceUsd: string;
  change24h: string;
  volume24h: string;
  marketCapUsd: string;
  lastUpdated: string;
  isStale: boolean;
}

@Injectable()
export class MarketService {
  // In-memory cache for quotes with TTL
  private readonly quoteCache = new Map<string, { data: MarketTickerDto; cachedAt: number }>();
  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds

  // Fallback deterministic fixtures for offline / rate-limited resilience
  private readonly fallbackFixtures: Record<string, { price: string; change: string; vol: string; mcap: string; name: string }> = {
    BTC: { name: 'Bitcoin', price: '67450.25000000', change: '3.45', vol: '32450000000.00', mcap: '1320000000000.00' },
    ETH: { name: 'Ethereum', price: '3520.80000000', change: '-1.15', vol: '18200000000.00', mcap: '423000000000.00' },
    SOL: { name: 'Solana', price: '158.40000000', change: '7.82', vol: '4120000000.00', mcap: '72500000000.00' },
    ADA: { name: 'Cardano', price: '0.48500000', change: '0.92', vol: '51000000.00', mcap: '17200000000.00' },
    DOT: { name: 'Polkadot', price: '7.25000000', change: '-2.40', vol: '280000000.00', mcap: '10100000000.00' },
  };

  constructor(private readonly prisma: PrismaService) {}

  async getAllTickers(): Promise<MarketTickerDto[]> {
    const assets = await this.prisma.asset.findMany({
      include: {
        marketQuotes: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const now = Date.now();
    const results: MarketTickerDto[] = [];

    for (const asset of assets) {
      const cached = this.quoteCache.get(asset.symbol);
      if (cached && now - cached.cachedAt < this.CACHE_TTL_MS) {
        results.push(cached.data);
        continue;
      }

      // Check DB latest quote
      const latestDbQuote = asset.marketQuotes[0];
      if (latestDbQuote) {
        const isStale = now - new Date(latestDbQuote.timestamp).getTime() > this.CACHE_TTL_MS;
        const dto: MarketTickerDto = {
          symbol: asset.symbol,
          name: asset.name,
          priceUsd: CryptoDecimalUtil.formatCrypto(latestDbQuote.priceUsd, 8),
          change24h: CryptoDecimalUtil.formatFiat(latestDbQuote.change24h, 2),
          volume24h: CryptoDecimalUtil.formatFiat(latestDbQuote.volume24h, 2),
          marketCapUsd: CryptoDecimalUtil.formatFiat(latestDbQuote.marketCapUsd, 2),
          lastUpdated: latestDbQuote.timestamp.toISOString(),
          isStale,
        };
        this.quoteCache.set(asset.symbol, { data: dto, cachedAt: now });
        results.push(dto);
      } else {
        // Fallback fixture
        const fallback = this.fallbackFixtures[asset.symbol] || {
          name: asset.name,
          price: '1.00000000',
          change: '0.00',
          vol: '1000000.00',
          mcap: '10000000.00',
        };
        const dto: MarketTickerDto = {
          symbol: asset.symbol,
          name: fallback.name,
          priceUsd: fallback.price,
          change24h: fallback.change,
          volume24h: fallback.vol,
          marketCapUsd: fallback.mcap,
          lastUpdated: new Date().toISOString(),
          isStale: true, // Marked as stale because it uses fallback
        };
        results.push(dto);
      }
    }

    return results;
  }

  async getTicker(symbol: string): Promise<MarketTickerDto> {
    const sym = symbol.toUpperCase();
    const all = await this.getAllTickers();
    const found = all.find((t) => t.symbol === sym);
    if (!found) throw new NotFoundException(`Cryptocurrency ${sym} not supported`);
    return found;
  }

  async getHistoricalCandles(symbol: string, days = 30) {
    const sym = symbol.toUpperCase();
    const asset = await this.prisma.asset.findUnique({ where: { symbol: sym } });
    if (!asset) throw new NotFoundException(`Cryptocurrency ${sym} not found`);

    // Generate deterministic simulated daily historical points
    const currentTicker = await this.getTicker(sym);
    const basePrice = new Decimal(currentTicker.priceUsd);

    const history = [];
    const now = Date.now();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      // Small deterministic pseudo-variation
      const variance = Math.sin(i * 0.8) * 0.05;
      const dayPrice = basePrice.times(new Decimal(1 + variance));

      history.push({
        date: date.toISOString().split('T')[0],
        priceUsd: CryptoDecimalUtil.formatCrypto(dayPrice, 4),
        high: CryptoDecimalUtil.formatCrypto(dayPrice.times(1.02), 4),
        low: CryptoDecimalUtil.formatCrypto(dayPrice.times(0.98), 4),
        volume: '150000000.00',
      });
    }

    return {
      symbol: sym,
      name: asset.name,
      currency: 'USD',
      history,
    };
  }
}
