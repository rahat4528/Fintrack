import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketService } from './market.service';

@Controller('api/v1/market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('tickers')
  getAllTickers() {
    return this.marketService.getAllTickers();
  }

  @Get('tickers/:symbol')
  getTicker(@Param('symbol') symbol: string) {
    return this.marketService.getTicker(symbol);
  }

  @Get('history/:symbol')
  getHistory(@Param('symbol') symbol: string, @Query('days') days?: string) {
    return this.marketService.getHistoricalCandles(symbol, days ? parseInt(days, 10) : 30);
  }
}
