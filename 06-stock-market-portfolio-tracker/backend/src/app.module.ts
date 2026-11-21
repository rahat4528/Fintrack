import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { SecuritiesModule } from './modules/securities/securities.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { TaxLotsModule } from './modules/tax-lots/tax-lots.module';
import { CorporateActionsModule } from './modules/corporate-actions/corporate-actions.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    SecuritiesModule,
    PortfoliosModule,
    TaxLotsModule,
    CorporateActionsModule,
    AnalyticsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
