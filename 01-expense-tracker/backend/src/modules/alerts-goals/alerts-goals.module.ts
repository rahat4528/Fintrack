import { Module } from '@nestjs/common';
import { AlertsGoalsService } from './alerts-goals.service';
import { AlertsGoalsController } from './alerts-goals.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AlertsGoalsController],
  providers: [AlertsGoalsService, PrismaService],
  exports: [AlertsGoalsService],
})
export class AlertsGoalsModule {}
