import { Module } from '@nestjs/common';
import { ForecastsService } from './forecasts.service';
import { ForecastsController } from './forecasts.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ForecastsController],
  providers: [ForecastsService, PrismaService],
  exports: [ForecastsService],
})
export class ForecastsModule {}
