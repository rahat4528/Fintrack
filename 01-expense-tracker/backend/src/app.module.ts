import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { RecurringModule } from './modules/recurring/recurring.module';
import { RulesModule } from './modules/rules/rules.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { AlertsGoalsModule } from './modules/alerts-goals/alerts-goals.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AccountsModule,
    TransactionsModule,
    CategoriesModule,
    RecurringModule,
    RulesModule,
    ReportsModule,
    ImportExportModule,
    AlertsGoalsModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
