import { Module } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';
import { PortfoliosController } from './portfolios.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PortfoliosController],
  providers: [PortfoliosService, PrismaService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
