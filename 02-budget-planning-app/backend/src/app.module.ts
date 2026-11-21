import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { AllocationsModule } from './modules/allocations/allocations.module';
import { DebtPlanningModule } from './modules/debt-planning/debt-planning.module';
import { ForecastsModule } from './modules/forecasts/forecasts.module';
import { SyncModule } from './modules/sync/sync.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    BudgetsModule,
    AllocationsModule,
    DebtPlanningModule,
    ForecastsModule,
    SyncModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
