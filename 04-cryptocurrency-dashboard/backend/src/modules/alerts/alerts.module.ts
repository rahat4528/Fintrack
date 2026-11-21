import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MarketModule } from '../market/market.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [MarketModule],
  controllers: [AlertsController],
  providers: [AlertsService, PrismaService],
  exports: [AlertsService],
})
export class AlertsModule {}
