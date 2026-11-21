import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { MarketModule } from './modules/market/market.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    MarketModule,
    PortfolioModule,
    AlertsModule,
    WatchlistModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
