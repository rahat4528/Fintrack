import { Module } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { MarketModule } from '../market/market.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [MarketModule],
  controllers: [WatchlistController],
  providers: [WatchlistService, PrismaService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
