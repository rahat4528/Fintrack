import { Module } from '@nestjs/common';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, PrismaService],
  exports: [MarketService],
})
export class MarketModule {}
